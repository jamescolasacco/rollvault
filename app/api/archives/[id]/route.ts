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

        const { id } = await params;
        const { title, description, showOnProfile } = await req.json();

        const archive = await prisma.archive.findUnique({ where: { id } });
        // @ts-ignore
        if (!archive || archive.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const updated = await prisma.archive.update({
            where: { id },
            data: { title, description, showOnProfile: showOnProfile ?? true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const archive = await prisma.archive.findUnique({ where: { id } });
        // @ts-ignore
        if (!archive || archive.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.archive.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
