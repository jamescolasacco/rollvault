"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Pin } from "lucide-react";

interface RollsGridProps {
    initialRolls: any[];
}

export default function RollsGrid({ initialRolls }: RollsGridProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredRolls = initialRolls.filter(roll =>
        roll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (roll.description && roll.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                    type="text"
                    placeholder="Search rolls by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-foreground/30 shadow-inner"
                />
            </div>

            {filteredRolls.length === 0 ? (
                <div className="py-12 border border-dashed border-border/50 rounded-xl text-center text-foreground/40 font-mono text-sm uppercase tracking-widest bg-card/5">
                    No matching rolls found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRolls.map((roll: any, i: number) => (
                        <Link key={roll.id} href={`/vault/rolls/${roll.id}`} className="block group animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${(i % 12) * 50}ms` }}>
                            <div className={`relative rounded-xl border p-4 shadow-sm hover:shadow-xl transition-all flex items-center gap-5 overflow-hidden ${roll.pinOrder !== null ? 'bg-yellow-500/5 border-yellow-500/30 hover:border-yellow-400/50' : 'bg-card border-border/50 hover:border-white/20'}`}>
                                {roll.pinOrder !== null && (
                                    <div className="absolute top-3 right-3 text-yellow-500 opacity-80 z-20">
                                        <Pin className="w-4 h-4 fill-yellow-500/20" />
                                    </div>
                                )}
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
                                    <p className="text-xs font-mono text-foreground opacity-40 mt-1 uppercase tracking-widest">{roll._count?.photos || 0} frames</p>
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
