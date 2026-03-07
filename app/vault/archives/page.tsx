import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FolderHeart } from "lucide-react";
import { CreateArchiveForm } from "@/app/vault/CreateArchiveForm";

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {archives.map((archive: any, i: number) => (
                        <Link key={archive.id} href={`/vault/archives/${archive.id}`} className="block group animate-in fade-in duration-700" style={{ animationDelay: `${(i % 12) * 50}ms` }}>
                            <div className="relative bg-card border border-border/50 p-6 shadow-md hover:border-accent/40 transition-colors flex flex-col justify-between rounded-xl overflow-hidden" style={{ minHeight: '160px' }}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FolderHeart className="w-5 h-5 text-accent opacity-50 group-hover:scale-110 transition-transform" />
                                        <h3 className="font-bold text-xl tracking-tight text-foreground truncate group-hover:text-white transition-colors">{archive.title}</h3>
                                    </div>
                                    <p className="text-foreground opacity-60 text-sm line-clamp-2">{archive.description || "No description."}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-mono text-foreground opacity-50 uppercase tracking-widest z-10">
                                    <span>{archive.rolls.length} Rolls</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
