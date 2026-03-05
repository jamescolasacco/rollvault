"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createRoll(formData: FormData) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!title) throw new Error("Title is required");

    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = "roll";
    const suffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${suffix}`;

    const roll = await prisma.roll.create({
        data: {
            title,
            slug,
            description,
            // @ts-ignore
            userId: session.user.id,
        },
    });

    redirect(`/dashboard/rolls/${roll.id}`);
}
