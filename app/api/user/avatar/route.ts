import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Optimize and crop to square with Sharp
        const optimizedBuffer = await sharp(buffer)
            .resize(400, 400, { fit: "cover" }) // 400x400 square avatar
            .jpeg({ quality: 80, progressive: true }) // Convert to high quality JPEG
            .toBuffer();

        // Convert the optimized buffer to a Base64 Data URL to bypass Next.js static asset limitations in production
        const base64Image = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;

        // Update User in DB
        const updated = await prisma.user.update({
            // @ts-ignore
            where: { id: session.user.id },
            data: { avatar: base64Image },
            select: { id: true, username: true, bio: true, avatar: true }
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("Avatar upload error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
