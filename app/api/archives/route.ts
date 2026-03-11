import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if ((session?.user as any)?.emailVerified === false) {
            return new NextResponse("Email verification required", { status: 403 });
        }

        const archives = await prisma.archive.findMany({
            where: { userId: (session?.user as any).id },
            include: { rolls: true },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(archives);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if ((session?.user as any)?.emailVerified === false) {
            return new NextResponse("Email verification required", { status: 403 });
        }

        const { title, description } = await req.json();

        if (!title) {
            return new NextResponse("Title is required", { status: 400 });
        }

        const archive = await prisma.archive.create({
            data: {
                title,
                description,
                userId: (session?.user as any).id
            }
        });

        return NextResponse.json(archive);
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
