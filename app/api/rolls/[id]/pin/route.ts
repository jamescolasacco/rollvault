import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session!.user as any).id;
        const { id } = await params;
        const { isPinned } = await req.json();

        // Verify ownership
        const roll = await prisma.roll.findUnique({
            where: { id },
            // @ts-ignore
            select: { userId: true, pinOrder: true }
        });

        if (!roll || roll.userId !== userId) {
            return new NextResponse("Not Found or Unauthorized", { status: 404 });
        }

        if (isPinned) {
            // Check if already pinned
            // @ts-ignore
            if (roll.pinOrder !== null) return NextResponse.json({ success: true, pinOrder: roll.pinOrder });

            // Ensure limit of 3
            const pinnedCount = await prisma.roll.count({
                // @ts-ignore
                where: { userId, pinOrder: { not: null } }
            });

            if (pinnedCount >= 3) {
                return new NextResponse("You can only pin up to 3 rolls.", { status: 400 });
            }

            const updated = await prisma.roll.update({
                where: { id },
                // @ts-ignore
                data: { pinOrder: pinnedCount + 1 }
            });

            // @ts-ignore
            return NextResponse.json({ success: true, pinOrder: updated.pinOrder });
        } else {
            // Unpinning logic
            // @ts-ignore
            if (roll.pinOrder === null) return NextResponse.json({ success: true });

            const pinnedRolls = await prisma.roll.findMany({
                // @ts-ignore
                where: { userId, pinOrder: { not: null } },
                // @ts-ignore
                orderBy: { pinOrder: 'asc' }
            });

            let newPinned = pinnedRolls.filter(r => r.id !== id);
            newPinned = newPinned.map((r, i) => ({ ...r, pinOrder: i + 1 }));

            const updates = [
                prisma.roll.update({ where: { id }, data: { pinOrder: null } as any }),
                ...newPinned.map(r => prisma.roll.update({
                    where: { id: r.id },
                    // @ts-ignore
                    data: { pinOrder: r.pinOrder }
                }))
            ];

            await prisma.$transaction(updates);

            return NextResponse.json({ success: true, pinOrder: null });
        }
    } catch (error) {
        console.error("Error toggling roll pin state:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
