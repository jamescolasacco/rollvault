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
        select: { username: true, bio: true, avatar: true }
    });

    if (!user) redirect("/login");

    return (
        <div className="py-8">
            <ProfileEditor user={user} />
        </div>
    );
}
