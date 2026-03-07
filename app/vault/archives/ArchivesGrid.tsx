"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, FolderHeart, ArrowUpDown } from "lucide-react";

interface ArchivesGridProps {
    initialArchives: any[];
}

export default function ArchivesGrid({ initialArchives }: ArchivesGridProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"updatedAt" | "title">("updatedAt");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const filteredArchives = initialArchives.filter(archive =>
        archive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (archive.description && archive.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const sortedArchives = [...filteredArchives].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "title") {
            comparison = a.title.localeCompare(b.title);
        } else if (sortBy === "updatedAt") {
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        return sortOrder === "asc" ? comparison : -comparison;
    });

    return (
        <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 border border-border/50 p-4 rounded-xl">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                        type="text"
                        placeholder="Search archives by title or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-foreground/30 shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-background border border-border/50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-foreground/80 flex-1 sm:flex-none cursor-pointer"
                    >
                        <option value="updatedAt">Last Edited</option>
                        <option value="title">Alphabetical</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                        className="p-3 rounded-lg border border-border/50 bg-background hover:bg-white/5 transition-colors text-foreground/60 hover:text-foreground"
                        title={sortOrder === "desc" ? "Descending" : "Ascending"}
                    >
                        <ArrowUpDown className={`w-4 h-4 transition-transform duration-300 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {filteredArchives.length === 0 ? (
                <div className="py-12 border border-dashed border-border/50 rounded-xl text-center text-foreground/40 font-mono text-sm uppercase tracking-widest bg-card/5">
                    No matching archives found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedArchives.map((archive: any, i: number) => (
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
                                    <span>{archive.rolls?.length || 0} Rolls</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
