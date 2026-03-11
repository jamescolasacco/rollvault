import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { buildUploadVerificationMessage } from "@/lib/uploadVerification";

const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!session.user.emailVerified) {
            return NextResponse.json({ error: "Email verification required." }, { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                emailVerified: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const uploadLockMessage = buildUploadVerificationMessage({
            emailVerified: user.emailVerified,
        });
        if (uploadLockMessage) {
            return NextResponse.json({ error: uploadLockMessage }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
        }

        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            return NextResponse.json({ error: "Avatar must be 10MB or less." }, { status: 400 });
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
