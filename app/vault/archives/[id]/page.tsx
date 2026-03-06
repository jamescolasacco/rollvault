import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Aperture } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { DeleteArchiveButton } from "@/components/DeleteArchiveButton";
import { EditArchiveClient } from "./EditArchiveClient";

export default async function ArchiveDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) redirect("/login");

    const archive = await prisma.archive.findUnique({
        where: { id },
        include: {
            user: { select: { username: true } },
            rolls: {
                orderBy: { createdAt: "desc" },
                include: {
                    _count: { select: { photos: true } },
                    photos: { take: 1, orderBy: { orderIndex: "asc" } }
                }
            }
        }
    });

    // @ts-ignore
    if (!archive || archive.userId !== session.user.id) {
        redirect("/vault");
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-start justify-between border-b border-border/50 pb-6 relative">
                <EditArchiveClient archive={archive} username={archive.user.username} />

                <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                    <span className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-1">Actions</span>
                    <DeleteArchiveButton id={archive.id} />
                </div>
            </div>

            {archive.rolls.length === 0 ? (
                <div className="border border-dashed border-border/50 rounded-xl p-16 text-center bg-card/10">
                    <Aperture className="w-12 h-12 text-foreground opacity-20 mx-auto mb-4 animate-spin-slow" />
                    <p className="text-foreground opacity-40 font-mono text-sm uppercase tracking-widest mb-4">Archive is empty</p>
                    <p className="text-sm text-foreground/50 max-w-sm mx-auto mb-6">
                        You can add rolls to this archive by editing them in your Vault Vault.
                    </p>
                    <Link href="/vault" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                        Browse Rolls
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {archive.rolls.map((roll: any) => (
                        <Link key={roll.id} href={`/vault/rolls/${roll.id}`}>
                            <div className="group bg-card border border-border/50 p-4 shadow-md hover:border-accent/40 transition-colors flex flex-col items-center h-[280px] justify-between relative overflow-hidden">
                                {/* Film border styling */}
                                <div className="absolute top-0 left-0 w-full flex justify-between px-2 pt-1 opacity-20 pointer-events-none">
                                    <div className="w-3 h-2 bg-black rounded-sm"></div><div className="w-3 h-2 bg-black rounded-sm"></div><div className="w-3 h-2 bg-black rounded-sm"></div><div className="w-3 h-2 bg-black rounded-sm"></div>
                                </div>

                                <div className="w-full aspect-square bg-black shadow-inner mb-4 relative overflow-hidden ring-1 ring-white/10 group-hover:ring-accent/30 transition-all z-10 mt-2">
                                    {roll.coverImage || roll.photos?.[0]?.url ? (
                                        <img src={roll.coverImage || roll.photos[0].url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 mix-blend-screen transition-opacity duration-500" alt={roll.title} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                            <span className="font-mono text-xs text-foreground/30 capitalize tracking-widest">Unexposed</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full text-center z-10">
                                    <h3 className="font-bold text-foreground group-hover:text-accent transition-colors truncate px-2">{roll.title}</h3>
                                    <p className="text-xs font-mono text-foreground/50 uppercase tracking-widest mt-1">{roll._count.photos} frames</p>
                                </div>

                                <div className="absolute bottom-0 left-0 w-full flex justify-between px-2 pb-1 opacity-20 pointer-events-none">
                                    <div className="w-3 h-2 bg-black rounded-sm"></div><div className="w-3 h-2 bg-black rounded-sm"></div><div className="w-3 h-2 bg-black rounded-sm"></div><div className="w-3 h-2 bg-black rounded-sm"></div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
