import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCovers() {
    console.log("Locating uncoupled legacy cover images...");
    const rolls = await prisma.roll.findMany({
        where: { coverImage: { not: null } }
    });

    let fixedCount = 0;

    for (const roll of rolls) {
        // If the coverImage is a direct grid photo (not a custom /covers/ upload)
        if (roll.coverImage && !roll.coverImage.includes("/covers/")) {
            await prisma.roll.update({
                where: { id: roll.id },
                data: { coverImage: null }
            });
            fixedCount++;
        }
    }

    console.log(`Reset ${fixedCount} legacy covers to rely on dynamic frame fallback.`);
}

fixCovers().finally(() => prisma.$disconnect());
