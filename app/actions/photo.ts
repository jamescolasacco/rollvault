"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadPhoto(formData: FormData) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    const rollId = formData.get("rollId") as string;
    const caption = formData.get("caption") as string | null;

    if (!file || !rollId) throw new Error("Missing file or rollId");

    // Verify roll belongs to user
    const roll = await prisma.roll.findUnique({ where: { id: rollId } });
    // @ts-ignore
    if (!roll || roll.userId !== session.user.id) throw new Error("Unauthorized roll access");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store in public/uploads for development simplicity
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() || "jpg";
    const filename = `${uuidv4()}.${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    await prisma.photo.create({
        data: {
            url,
            caption,
            rollId,
        },
    });

    // (Legacy cover setting block removed in favor of dynamic fallback)

    revalidatePath(`/dashboard/rolls/${rollId}`);
}
