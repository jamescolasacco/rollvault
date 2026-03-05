import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify roll ownership
        const roll = await prisma.roll.findUnique({ where: { id } });
        // @ts-ignore
        if (!roll || roll.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Process keeping aspect ratio but capping width to 1200px for a cover
        const processedBuffer = await sharp(buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

        const uploadDir = join(process.cwd(), "public", "uploads", "covers");
        await mkdir(uploadDir, { recursive: true });

        const filename = `cover_${uuidv4()}.jpg`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, processedBuffer);
        const url = `/uploads/covers/${filename}`;

        const updated = await prisma.roll.update({
            where: { id },
            data: { coverImage: url },
            select: { id: true, coverImage: true }
        });

        return NextResponse.json({ success: true, roll: updated });
    } catch (error) {
        console.error("Cover upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const roll = await prisma.roll.findUnique({ where: { id } });
        // @ts-ignore
        if (!roll || roll.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (roll.coverImage && roll.coverImage.startsWith("/uploads/covers/")) {
            try {
                const filepath = join(process.cwd(), "public", roll.coverImage);
                await unlink(filepath);
            } catch (err) {
                console.error("Failed to delete custom cover file:", err);
            }
        }

        const updated = await prisma.roll.update({
            where: { id },
            data: { coverImage: null },
            select: { id: true, coverImage: true }
        });

        return NextResponse.json({ success: true, roll: updated });
    } catch (error) {
        console.error("Cover delete error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
