import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ArrowLeft, Plus } from "lucide-react";

export default async function AllRollsPage() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    const userId = session?.user?.id;

    const rolls: any = await prisma.roll.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            _count: { select: { photos: true } },
            photos: { take: 1, orderBy: { orderIndex: "asc" } }
        }
    });

    return (
        <div className="space-y-8 mt-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
                <div>
                    <Link href="/vault" className="inline-flex items-center gap-2 text-sm font-mono text-foreground/50 hover:text-foreground transition-colors mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Vault
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Your Rolls</h1>
                    <p className="text-foreground/60 mt-1">All {rolls.length} of your developed rolls.</p>
                </div>
                <Link href="/vault/rolls/new">
                    <Button variant="safelight" className="gap-2">
                        <Plus className="w-4 h-4" /> New Roll
                    </Button>
                </Link>
            </div>

            {rolls.length === 0 ? (
                <div className="border border-dashed border-border/50 rounded-xl p-16 text-center bg-card/10">
                    <p className="text-foreground/50 mb-4 font-mono text-sm uppercase tracking-widest">No rolls developed yet</p>
                    <Link href="/vault/rolls/new">
                        <Button variant="outline">Create your first roll</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rolls.map((roll: any, i: number) => (
                        <Link key={roll.id} href={`/vault/rolls/${roll.id}`} className="block group animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${(i % 12) * 50}ms` }}>
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
        </div>
    );
}
