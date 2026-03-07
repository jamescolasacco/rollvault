import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // @ts-ignore
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;
        const { updates } = await req.json();

        if (!Array.isArray(updates)) {
            return new NextResponse("Invalid payload", { status: 400 });
        }

        // We run these updates in a transaction to ensure database consistency
        await prisma.$transaction(
            updates.map((update: { id: string; pinOrder: number | null }) =>
                prisma.roll.update({
                    where: {
                        id: update.id,
                        userId: userId // Security check to ensure the user owns the roll
                    },
                    // @ts-ignore
                    data: {
                        pinOrder: update.pinOrder
                    }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PUT /api/user/pinned Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
