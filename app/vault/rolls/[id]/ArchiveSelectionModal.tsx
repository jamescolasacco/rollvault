"use client";

import { useState } from "react";
import { Search, FolderHeart, X, Check } from "lucide-react";
import { Button } from "@/components/Button";

interface ArchiveSelectionModalProps {
    archives: any[];
    initialSelectedIds: string[];
    onSave: (selectedIds: string[]) => void;
    onClose: () => void;
}

export function ArchiveSelectionModal({ archives, initialSelectedIds, onSave, onClose }: ArchiveSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));

    const filteredArchives = archives.filter(archive =>
        archive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (archive.description && archive.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border/50 shadow-2xl overflow-hidden shadow-black/50">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Manage Archives</h2>
                        <p className="text-sm text-foreground/50 mt-1">Select which archives this roll should belong to.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-foreground/50 hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search your archives..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-foreground/30 shadow-inner"
                        />
                    </div>

                    {filteredArchives.length === 0 ? (
                        <div className="py-12 border border-dashed border-border/50 rounded-xl text-center text-foreground/40 font-mono text-sm uppercase tracking-widest bg-background/50">
                            No archives found
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredArchives.map((archive) => {
                                const isSelected = selectedIds.has(archive.id);
                                return (
                                    <div
                                        key={archive.id}
                                        onClick={() => toggleSelection(archive.id)}
                                        className={`relative group cursor-pointer border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between rounded-xl overflow-hidden h-36 select-none ${isSelected ? 'bg-accent/10 border-accent/50' : 'bg-background border-border/50 hover:border-accent/30'}`}
                                    >
                                        <div className="z-10 pr-6 pointer-events-none">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FolderHeart className={`w-5 h-5 transition-transform ${isSelected ? 'text-accent' : 'text-accent/40 group-hover:text-accent/60'}`} />
                                                <h3 className={`font-bold text-lg tracking-tight truncate transition-colors ${isSelected ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>{archive.title}</h3>
                                            </div>
                                            <p className="text-xs text-foreground/50 line-clamp-2">{archive.description || "No description."}</p>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-4 right-4 text-accent animate-in zoom-in duration-200">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        )}
                                        {!isSelected && (
                                            <div className="absolute top-4 right-4 w-5 h-5 rounded-full border border-border/50 group-hover:border-accent/30 transition-colors" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border/50 bg-background/50 flex items-center justify-between">
                    <span className="text-sm font-mono text-foreground/50">{selectedIds.size} archive{selectedIds.size === 1 ? '' : 's'} selected</span>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button variant="safelight" onClick={() => onSave(Array.from(selectedIds))}>Save Selection</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
