import { PrismaClient } from '@prisma/client';
import { readFile, unlink, readdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const prisma = new PrismaClient();

async function processLegacyImages() {
    console.log("Starting legacy image compression sweep...");
    const publicDir = join(process.cwd(), 'public');

    // 1. Process Photos
    console.log("\\n--- Processing Photos ---");
    const photos = await prisma.photo.findMany();
    let photoCount = 0;

    for (const photo of photos) {
        if (!photo.url.endsWith('.webp') && photo.url.startsWith('/uploads/')) {
            try {
                const oldPath = join(publicDir, photo.url);
                const buffer = await readFile(oldPath);

                const newFilename = photo.url.replace(/\\.[^/.]+$/, "") + ".webp";
                const newPath = join(publicDir, newFilename);

                console.log(`Compressing ${photo.url} -> ${newFilename}`);

                await sharp(buffer)
                    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
                    .webp({ quality: 80, effort: 4 })
                    .toFile(newPath);

                await prisma.photo.update({
                    where: { id: photo.id },
                    data: { url: newFilename }
                });

                await unlink(oldPath);
                photoCount++;
            } catch (error) {
                console.error(`Failed to process photo ${photo.id}: ${photo.url}`, error);
            }
        }
    }

    // 2. Process Roll Covers
    console.log("\\n--- Processing Roll Covers ---");
    const rolls = await prisma.roll.findMany({
        where: { coverImage: { not: null } }
    });
    let coverCount = 0;

    for (const roll of rolls) {
        if (roll.coverImage && !roll.coverImage.endsWith('.webp') && roll.coverImage.startsWith('/uploads/covers/')) {
            try {
                const oldPath = join(publicDir, roll.coverImage);
                const buffer = await readFile(oldPath);

                const newFilename = roll.coverImage.replace(/\\.[^/.]+$/, "") + ".webp";
                const newPath = join(publicDir, newFilename);

                console.log(`Compressing cover ${roll.coverImage} -> ${newFilename}`);

                await sharp(buffer)
                    .resize({ width: 1200, withoutEnlargement: true })
                    .webp({ quality: 80, effort: 4 })
                    .toFile(newPath);

                await prisma.roll.update({
                    where: { id: roll.id },
                    data: { coverImage: newFilename }
                });

                await unlink(oldPath);
                coverCount++;
            } catch (error) {
                console.error(`Failed to process cover for roll ${roll.id}: ${roll.coverImage}`, error);
            }
        }
    }

    // 3. Process Public Demo Assets
    console.log("\\n--- Processing Static Demo Images ---");
    const demoDir = join(publicDir, 'demo');
    let demoCount = 0;
    try {
        const demoFiles = await readdir(demoDir);
        for (const file of demoFiles) {
            if (file.endsWith('.jpg') || file.endsWith('.png')) {
                const oldPath = join(demoDir, file);
                const newFilename = file.replace(/\\.[^/.]+$/, "") + ".webp";
                const newPath = join(demoDir, newFilename);
                console.log(`Compressing static demo file ${file} -> ${newFilename}`);

                const buffer = await readFile(oldPath);
                await sharp(buffer)
                    .resize({ width: 2400, withoutEnlargement: true })
                    .webp({ quality: 80, effort: 4 })
                    .toFile(newPath);

                await unlink(oldPath);
                demoCount++;
            }
        }
    } catch (e) {
        console.log("No demo directory found or error reading.");
    }

    // 4. Process Legacy Database Avatars
    console.log("\\n--- Processing Legacy Avatars ---");
    const users = await prisma.user.findMany({
        where: { avatar: { not: null } }
    });
    let avatarCount = 0;

    for (const user of users) {
        if (user.avatar && (user.avatar.startsWith('data:image/jpeg') || user.avatar.startsWith('data:image/png'))) {
            try {
                const base64Data = user.avatar.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');

                if (buffer.length > 10 * 1024) {
                    console.log(`Compressing avatar for @${user.username}...`);

                    const optimizedBuffer = await sharp(buffer)
                        .resize({ width: 400, height: 400, fit: "cover", withoutEnlargement: true })
                        .webp({ quality: 80, effort: 4 })
                        .toBuffer();

                    const newBase64 = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: { avatar: newBase64 }
                    });
                    avatarCount++;
                }
            } catch (error) {
                console.error(`Failed to process avatar for @${user.username}`, error);
            }
        }
    }

    console.log(`\\nSweep complete. Compressed ${photoCount} photos, ${coverCount} covers, ${demoCount} demo assets, and ${avatarCount} DB avatars.`);
}

processLegacyImages().catch(console.error).finally(() => prisma.$disconnect());
