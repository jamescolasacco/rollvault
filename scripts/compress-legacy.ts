import { PrismaClient } from '@prisma/client';
import { readFile, unlink } from 'fs/promises';
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

    console.log(`\\nSweep complete. Compressed ${photoCount} photos and ${coverCount} covers.`);
}

processLegacyImages().catch(console.error).finally(() => prisma.$disconnect());
