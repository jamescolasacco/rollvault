import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileEditor from "./ProfileEditor";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: session.user.id },
        select: { username: true, bio: true, avatar: true, tier: true }
    });

    if (!user) redirect("/login");

    const photoCount = await prisma.photo.count({
        // @ts-ignore
        where: { roll: { userId: session.user.id } }
    });

    return (
        <div className="py-8">
            <ProfileEditor user={{ ...user, photoCount }} />
        </div>
    );
}
