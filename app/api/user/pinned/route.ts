import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if (!session.user.emailVerified) {
            return new NextResponse("Email verification required", { status: 403 });
        }

        const userId = session.user.id;
        const { updates } = await req.json();

        if (!Array.isArray(updates)) {
            return new NextResponse("Invalid payload", { status: 400 });
        }

        if (
            updates.some(
                (update: any) =>
                    !update ||
                    typeof update.id !== "string" ||
                    !(
                        update.pinOrder === null ||
                        (Number.isInteger(update.pinOrder) && update.pinOrder >= 1 && update.pinOrder <= 3)
                    )
            )
        ) {
            return new NextResponse("Invalid payload", { status: 400 });
        }

        const pinnedValues = updates
            .map((update: any) => update.pinOrder)
            .filter((value: number | null) => value !== null) as number[];
        const uniquePinnedValues = new Set(pinnedValues);
        if (uniquePinnedValues.size !== pinnedValues.length) {
            return new NextResponse("Invalid pin order", { status: 400 });
        }

        const ids = updates.map((update: any) => update.id);
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length !== ids.length) {
            return new NextResponse("Invalid payload", { status: 400 });
        }

        const ownedRolls = await prisma.roll.findMany({
            where: { userId, id: { in: uniqueIds } },
            select: { id: true },
        });
        if (ownedRolls.length !== uniqueIds.length) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        await prisma.$transaction(
            updates.map((update: { id: string; pinOrder: number | null }) =>
                prisma.roll.update({
                    where: { id: update.id },
                    data: { pinOrder: update.pinOrder },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT /api/user/pinned Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
