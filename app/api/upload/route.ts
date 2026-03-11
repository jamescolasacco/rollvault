import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { buildUploadVerificationMessage } from "@/lib/uploadVerification";

const MAX_FILES_PER_UPLOAD = 50;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
]);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!session.user.emailVerified) {
            return NextResponse.json({ error: "Email verification required." }, { status: 403 });
        }

        const formData = await req.formData();
        const rollId = formData.get("rollId") as string;
        const files = formData.getAll("files") as File[];

        if (!rollId || files.length === 0) {
            return NextResponse.json({ error: "Missing rollId or files" }, { status: 400 });
        }

        if (files.length > MAX_FILES_PER_UPLOAD) {
            return NextResponse.json(
                { error: `Too many files. Maximum ${MAX_FILES_PER_UPLOAD} per upload.` },
                { status: 400 }
            );
        }

        for (const file of files) {
            if (!file || !file.type || !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
                return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return NextResponse.json(
                    { error: `Each file must be ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB or less.` },
                    { status: 400 }
                );
            }
        }

        // Verify roll belongs to user and get their tier
        const roll = await prisma.roll.findUnique({
            where: { id: rollId },
            include: {
                photos: { orderBy: { orderIndex: 'desc' }, take: 1 },
                user: {
                    select: {
                        tier: true,
                        id: true,
                        emailVerified: true,
                    }
                }
            }
        });

        if (!roll || roll.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized roll access" }, { status: 403 });
        }

        const uploadLockMessage = buildUploadVerificationMessage({
            emailVerified: roll.user.emailVerified,
        });
        if (uploadLockMessage) {
            return NextResponse.json({ error: uploadLockMessage }, { status: 403 });
        }

        // Enforce Free Tier Photo Limits
        if (roll.user.tier === "FREE") {
            const totalPhotos = await prisma.photo.count({
                where: { roll: { userId: roll.user.id } }
            });

            if (totalPhotos + files.length > 1000) {
                return NextResponse.json(
                    { error: `Free tier limit reached (1000 photos maximum). You currently have ${totalPhotos} photos. Please delete some or upgrade to Pro.` },
                    { status: 403 }
                );
            }
        }

        let currentMaxOrder = roll.photos.length > 0 ? roll.photos[0].orderIndex : -1;

        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const createdPhotos = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Enforce webp conversion sequence
            const filename = `${uuidv4()}.webp`;
            const filepath = join(uploadDir, filename);

            // Execute high-performance image compression pipeline
            try {
                await sharp(buffer)
                    .resize({
                        width: 2400,
                        height: 2400,
                        fit: "inside",
                        withoutEnlargement: true
                    })
                    .webp({ quality: 80, effort: 4 })
                    .toFile(filepath);
            } catch {
                return NextResponse.json(
                    { error: "One or more files could not be processed as valid images." },
                    { status: 400 }
                );
            }

            const url = `/uploads/${filename}`;

            currentMaxOrder += 1;

            const newPhoto = await prisma.photo.create({
                data: {
                    url,
                    rollId,
                    orderIndex: currentMaxOrder,
                },
            });

            createdPhotos.push(newPhoto);
        }

        return NextResponse.json({ success: true, count: createdPhotos.length, photos: createdPhotos });
    } catch (error) {
        console.error("Batch upload error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
