import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FolderHeart } from "lucide-react";
import { CreateArchiveForm } from "@/app/vault/CreateArchiveForm";
import ArchivesGrid from "./ArchivesGrid";

export default async function AllArchivesPage() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    const userId = session?.user?.id;

    const archives = await prisma.archive.findMany({
        where: { userId },
        include: {
            rolls: {
                include: { _count: { select: { photos: true } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-8 mt-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
                <div>
                    <Link href="/vault" className="inline-flex items-center gap-2 text-sm font-mono text-foreground/50 hover:text-foreground transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Vault
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Your Archives</h1>
                    <p className="text-foreground/60 mt-1">All {archives.length} of your organized collections.</p>
                </div>
                <CreateArchiveForm />
            </div>

            {archives.length === 0 ? (
                <div className="border border-dashed border-border/50 rounded-xl p-16 text-center bg-card/10">
                    <FolderHeart className="w-12 h-12 text-foreground opacity-20 mx-auto mb-4" />
                    <p className="text-foreground opacity-40 font-mono text-sm uppercase tracking-widest">No archives created yet</p>
                </div>
            ) : (
                <ArchivesGrid initialArchives={archives} />
            )}
        </div>
    );
}
