import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/Button";
import { FolderHeart, Plus } from "lucide-react";
import { CreateArchiveForm } from "./CreateArchiveForm";

export default async function DashboardPage({
    searchParams
}: {
    searchParams?: { [key: string]: string | string[] | undefined }
}) {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    const userId = session?.user?.id;

    // Fetch User Rolls & associated stats
    const rolls: any = await prisma.roll.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { photos: true } },
            photos: { take: 1, orderBy: { orderIndex: "asc" } }
        }
    });

    // Fetch Archives
    const archives = await prisma.archive.findMany({
        where: { userId },
        include: {
            rolls: {
                include: { _count: { select: { photos: true } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Calculate Live Stats
    const totalRolls = rolls.length;
    const totalFrames = rolls.reduce((acc: number, roll: any) => acc + roll._count.photos, 0);
    const totalArchives = archives.length;

    const showAllRolls = searchParams?.showAllRolls === "true";
    const showAllArchives = searchParams?.showAllArchives === "true";

    const displayRolls = showAllRolls ? rolls : rolls.slice(0, 6);
    const displayArchives = showAllArchives ? archives : archives.slice(0, 6);

    return (
        <div className="space-y-12 mt-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Vault</h1>
                    <p className="text-foreground/60 mt-1">Manage your film rolls and public profile.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/${session?.user?.name}`} target="_blank" className="hidden sm:block">
                        <Button variant="outline">View Public Vault</Button>
                    </Link>
                    <Link href="/dashboard/profile">
                        <Button variant="outline" className="gap-2">
                            Edit Profile
                        </Button>
                    </Link>
                    <Link href="/dashboard/rolls/new">
                        <Button variant="safelight" className="gap-2">
                            <Plus className="w-4 h-4" /> New Roll
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Dashboard Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm group hover:border-accent/30 transition-colors">
                    <div className="text-3xl font-bold text-accent mb-1 group-hover:scale-110 transition-transform origin-left w-max">{totalRolls}</div>
                    <div className="text-xs font-mono uppercase tracking-widest text-foreground/50">Total Rolls</div>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm group hover:border-white/30 transition-colors">
                    <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform origin-left w-max">{totalFrames}</div>
                    <div className="text-xs font-mono uppercase tracking-widest text-foreground/50">Total Frames</div>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm group hover:border-white/30 transition-colors">
                    <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform origin-left w-max">{totalArchives}</div>
                    <div className="text-xs font-mono uppercase tracking-widest text-foreground/50">Archives</div>
                </div>
            </div>

            {/* Recent Rolls */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h2 className="text-2xl font-bold tracking-tight">Recent Rolls</h2>
                </div>

                {rolls.length === 0 ? (
                    <div className="border border-dashed border-border/50 rounded-xl p-16 text-center bg-card/10">
                        <p className="text-foreground/50 mb-4 font-mono text-sm uppercase tracking-widest">No rolls developed yet</p>
                        <Link href="/dashboard/rolls/new">
                            <Button variant="outline">Create your first roll</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayRolls.map((roll: any, i: number) => (
                            <Link key={roll.id} href={`/dashboard/rolls/${roll.id}`} className="block group animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="relative bg-card rounded-xl border border-border/50 p-4 shadow-sm hover:shadow-xl hover:border-white/20 transition-all flex items-center gap-5 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="w-20 h-20 shrink-0 bg-black rounded-lg overflow-hidden relative border border-white/5 z-10">
                                        {roll.coverImage || roll.photos?.[0]?.url ? (
                                            <img src={roll.coverImage || roll.photos[0].url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-500 mix-blend-screen scale-105" alt="cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-mono text-[8px] text-foreground opacity-20 uppercase tracking-widest text-center">Empty</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 z-10 leading-tight">
                                        <h3 className="font-bold text-lg text-foreground group-hover:text-white transition-colors truncate">{roll.title}</h3>
                                        <p className="text-xs font-mono text-foreground opacity-40 mt-1 uppercase tracking-widest">{roll._count.photos} frames</p>
                                        <p className="text-sm mt-1.5 text-foreground opacity-50 italic line-clamp-1">{roll.description || "No description."}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {rolls.length > 6 && !showAllRolls && (
                    <div className="mt-8 flex justify-center animate-in fade-in duration-700">
                        <Link href={`/dashboard?showAllRolls=true${showAllArchives ? '&showAllArchives=true' : ''}`} scroll={false}>
                            <Button variant="outline">Show all rolls ({rolls.length})</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Archives */}
            <div className="space-y-6 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-accent pl-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-1">Your Archives</h2>
                        <p className="text-sm text-foreground opacity-60">Organize your collections into subfolders.</p>
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
                        {displayArchives.map((archive: any, i: number) => (
                            <Link key={archive.id} href={`/dashboard/archives/${archive.id}`} className="block group animate-in fade-in duration-700" style={{ animationDelay: `${i * 100}ms` }}>
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

                {archives.length > 6 && !showAllArchives && (
                    <div className="mt-8 flex justify-center animate-in fade-in duration-700">
                        <Link href={`/dashboard?showAllArchives=true${showAllRolls ? '&showAllRolls=true' : ''}`} scroll={false}>
                            <Button variant="outline">Show all archives ({archives.length})</Button>
                        </Link>
                    </div>
                )}
            </div>

        </div>
    );
}
