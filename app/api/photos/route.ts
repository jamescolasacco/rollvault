import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, caption, orderIndex } = await req.json();

        if (!id) return NextResponse.json({ error: "Missing photo id" }, { status: 400 });

        const photo = await prisma.photo.findUnique({
            where: { id },
            include: { roll: true }
        });

        // @ts-ignore
        if (!photo || photo.roll.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized photo access" }, { status: 403 });
        }

        const dataToUpdate: any = {};
        if (caption !== undefined) dataToUpdate.caption = caption;
        if (orderIndex !== undefined) dataToUpdate.orderIndex = orderIndex;

        const updated = await prisma.photo.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json({ success: true, photo: updated });
    } catch (error) {
        console.error("Update photo error", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing config ID" }, { status: 400 });

        const photo = await prisma.photo.findUnique({
            where: { id },
            include: { roll: true }
        });

        // @ts-ignore
        if (!photo || photo.roll.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized photo access" }, { status: 403 });
        }

        await prisma.photo.delete({ where: { id } });

        // Note: Actually deleting the file off the local disk is skipped here 
        // for simplicity, but in a real app or with S3, you'd delete it via fs.unlink/S3 sdk.

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
