import { PrismaClient } from '@prisma/client';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function sweepOrphans() {
    console.log("Starting physical sweep of orphaned photo uploads...");
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Read all files in public/uploads
    let files;
    try {
        files = await readdir(uploadDir);
    } catch {
        console.log('No uploads directory found. Nothing to sweep.');
        return;
    }

    // Get all valid photo URLs from the database
    const photos = await prisma.photo.findMany({ select: { url: true } });
    const validFilenames = new Set(photos.map(p => p.url.replace('/uploads/', '')));

    let deletedCount = 0;

    for (const file of files) {
        if (file === '.gitkeep') continue;

        if (!validFilenames.has(file)) {
            // File exists on disk, but has no Prisma database record (Orphan)
            try {
                await unlink(join(uploadDir, file));
                console.log(`Swept orphaned file: ${file}`);
                deletedCount++;
            } catch (e) {
                console.error(`Failed to delete ${file}`, e);
            }
        }
    }

    console.log(`Sweep complete. Cleared ${deletedCount} orphaned files from ${uploadDir}.`);
}

sweepOrphans().finally(() => prisma.$disconnect());
