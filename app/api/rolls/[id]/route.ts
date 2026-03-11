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
        if ((session?.user as any)?.emailVerified === false) {
            return new NextResponse("Email verification required", { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { title, description, dateDeveloped, archiveIds, showOnProfile } = body;

        // Verify ownership
        const roll = await prisma.roll.findUnique({
            where: { id: id },
            select: { userId: true }
        });

        if (!roll) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (roll.userId !== (session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Update roll
        const updatedRoll = await prisma.roll.update({
            where: { id: id },
            data: {
                title,
                description,
                showOnProfile: showOnProfile ?? true,
                // @ts-ignore
                dateDeveloped: dateDeveloped ? new Date(dateDeveloped) : null,
                // @ts-ignore
                archives: {
                    set: (archiveIds || []).map((id: string) => ({ id }))
                }
            },
            include: {
                // @ts-ignore
                archives: true
            }
        });

        return NextResponse.json(updatedRoll);
    } catch (error) {
        console.error("Error updating roll:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if ((session?.user as any)?.emailVerified === false) {
            return new NextResponse("Email verification required", { status: 403 });
        }

        const { id } = await params;

        const roll = await prisma.roll.findUnique({
            where: { id },
            include: { photos: true }
        });

        if (!session || !roll || roll.userId !== (session.user as any).id) {
            return new NextResponse("Not Found or Unauthorized", { status: 404 });
        }

        // Execute physical sweep of all images associated with this roll
        for (const photo of roll.photos) {
            if (photo.url.startsWith("/uploads/")) {
                try {
                    const filepath = join(process.cwd(), "public", photo.url);
                    await unlink(filepath);
                } catch (fsError) {
                    console.error("Failed to sweep file:", photo.url, fsError);
                }
            }
        }

        // Safe database deletion - cascades to photos via Prisma
        await prisma.roll.delete({ where: { id } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting roll:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
