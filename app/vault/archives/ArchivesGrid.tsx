"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, FolderHeart } from "lucide-react";

interface ArchivesGridProps {
    initialArchives: any[];
}

export default function ArchivesGrid({ initialArchives }: ArchivesGridProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredArchives = initialArchives.filter(archive =>
        archive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (archive.description && archive.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <input
                    type="text"
                    placeholder="Search archives by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-foreground/30 shadow-inner"
                />
            </div>

            {filteredArchives.length === 0 ? (
                <div className="py-12 border border-dashed border-border/50 rounded-xl text-center text-foreground/40 font-mono text-sm uppercase tracking-widest bg-card/5">
                    No matching archives found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArchives.map((archive: any, i: number) => (
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
