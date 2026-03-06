import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setTier() {
    // Slice off 'node' and the script path
    const args = process.argv.slice(2);

    if (args.length !== 2) {
        console.error("❌ Usage: npx tsx scripts/set-tier.ts <username> <FREE|PRO|ADMIN>");
        process.exit(1);
    }

    const username = args[0];
    const newTier = args[1].toUpperCase();

    const validTiers = ["FREE", "PRO", "ADMIN"];
    if (!validTiers.includes(newTier)) {
        console.error(`❌ Invalid tier: '${newTier}'. Must be one of: FREE, PRO, ADMIN`);
        process.exit(1);
    }

    console.log(`Looking up user: @${username}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            console.error(`❌ User @${username} not found in database.`);
            process.exit(1);
        }

        const updated = await prisma.user.update({
            where: { username },
            data: { tier: newTier },
            select: { username: true, tier: true }
        });

        console.log(`✅ Success! @${updated.username} is now on the ${updated.tier} plan.`);

    } catch (error) {
        console.error("❌ Database error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

setTier();
