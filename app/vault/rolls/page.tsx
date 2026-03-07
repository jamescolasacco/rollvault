import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ArrowLeft, Plus } from "lucide-react";
import RollsGrid from "./RollsGrid";

export default async function AllRollsPage() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    const userId = session?.user?.id;

    const rolls: any = await prisma.roll.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
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
                <RollsGrid initialRolls={rolls} />
            )}
        </div>
    );
}
