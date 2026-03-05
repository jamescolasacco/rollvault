import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const photo = await prisma.photo.findUnique({
            where: { id },
            include: { roll: { select: { userId: true } } }
        });

        if (!session || !photo || photo.roll.userId !== (session.user as any).id) {
            return new NextResponse("Not Found or Unauthorized", { status: 404 });
        }

        // Delete from database
        await prisma.photo.delete({ where: { id } });

        // Sweep physical file from disk
        if (photo.url.startsWith("/uploads/")) {
            try {
                const filepath = join(process.cwd(), "public", photo.url);
                await unlink(filepath);
            } catch (fsError) {
                console.error("Failed to delete physical file:", photo.url, fsError);
                // We don't fail the request if the file was already missing
            }
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting photo:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
