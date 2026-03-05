import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const rollId = formData.get("rollId") as string;
        const files = formData.getAll("files") as File[];

        if (!rollId || files.length === 0) {
            return NextResponse.json({ error: "Missing rollId or files" }, { status: 400 });
        }

        // Verify roll belongs to user
        const roll = await prisma.roll.findUnique({
            where: { id: rollId },
            include: { photos: { orderBy: { orderIndex: 'desc' }, take: 1 } }
        });

        // @ts-ignore
        if (!roll || roll.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized roll access" }, { status: 403 });
        }

        let currentMaxOrder = roll.photos.length > 0 ? roll.photos[0].orderIndex : -1;

        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const createdPhotos = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const ext = file.name.split('.').pop() || "jpg";
            const filename = `${uuidv4()}.${ext}`;
            const filepath = join(uploadDir, filename);

            await writeFile(filepath, buffer);
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

            // Set first photo as cover if necessary
            if (!roll.coverImage && currentMaxOrder === 0) {
                await prisma.roll.update({
                    where: { id: rollId },
                    data: { coverImage: url },
                });
            }
        }

        return NextResponse.json({ success: true, count: createdPhotos.length, photos: createdPhotos });
    } catch (error) {
        console.error("Batch upload error", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
