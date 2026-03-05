import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { updates } = await req.json();

        if (!Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid payloads" }, { status: 400 });
        }

        // We can run these in a transaction
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
