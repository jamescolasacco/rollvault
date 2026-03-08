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

    // Generate a random 18-char alphanumeric slug (e.g. "ft3ng8gd9se0hh4fr3")
    const slug = Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map(b => (b % 36).toString(36))
        .join('');

    const roll = await prisma.roll.create({
        data: {
            title,
            slug,
            description,
            // @ts-ignore
            userId: session.user.id,
        },
    });

    redirect(`/vault/rolls/${roll.id}`);
}
