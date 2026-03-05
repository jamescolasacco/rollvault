import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RollEditorClient from "./RollEditorClient";

export default async function RollPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session?.user?.id) redirect("/login");

    const roll = await prisma.roll.findUnique({
        where: { id },
        include: {
            photos: { orderBy: { orderIndex: "asc" } },
            archives: true,
            user: { select: { username: true } }
        },
    });

    const archives = await prisma.archive.findMany({
        // @ts-ignore
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    });

    // @ts-ignore
    if (!roll || roll.userId !== session.user.id) redirect("/dashboard");

    return <RollEditorClient roll={roll} archives={archives} />;
}
