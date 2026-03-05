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

        const { bio, avatar } = await req.json();

        const dataToUpdate: any = {};
        if (bio !== undefined) dataToUpdate.bio = bio;
        if (avatar !== undefined) dataToUpdate.avatar = avatar;

        const updated = await prisma.user.update({
            // @ts-ignore
            where: { id: session.user.id },
            data: dataToUpdate,
            select: { id: true, username: true, bio: true, avatar: true }
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("Update profile error", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
