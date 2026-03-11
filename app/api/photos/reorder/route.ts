import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!session.user.emailVerified) {
            return NextResponse.json({ error: "Email verification required." }, { status: 403 });
        }

        const { updates } = await req.json();

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid payloads" }, { status: 400 });
        }

        if (
            updates.some(
                (update: any) =>
                    !update ||
                    typeof update.id !== "string" ||
                    !Number.isInteger(update.orderIndex) ||
                    update.orderIndex < 0
            )
        ) {
            return NextResponse.json({ error: "Invalid reorder data." }, { status: 400 });
        }

        const ids = updates.map((update: any) => update.id);
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length !== ids.length) {
            return NextResponse.json({ error: "Duplicate photo IDs are not allowed." }, { status: 400 });
        }

        const ownedPhotos = await prisma.photo.findMany({
            where: {
                id: { in: uniqueIds },
                roll: { userId: session.user.id },
            },
            select: { id: true },
        });

        if (ownedPhotos.length !== uniqueIds.length) {
            return NextResponse.json({ error: "Unauthorized photo access." }, { status: 403 });
        }

        await prisma.$transaction(
            updates.map((update: any) =>
                prisma.photo.update({
                    where: { id: update.id },
                    data: { orderIndex: update.orderIndex },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Bulk reorder error", error);
        return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
    }
}
