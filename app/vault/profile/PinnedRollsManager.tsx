"use client";

import { useState } from "react";
import { Pin, ArrowUp, ArrowDown, X, Loader2 } from "lucide-react";

interface Roll {
    id: string;
    title: string;
    pinOrder: number | null;
    photos: { url: string }[];
    coverImage: string | null;
}

export default function PinnedRollsManager({ initialRolls }: { initialRolls: Roll[] }) {
    const [rolls, setRolls] = useState<Roll[]>(initialRolls);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const pinnedRolls = rolls.filter(r => r.pinOrder !== null).sort((a, b) => (a.pinOrder || 0) - (b.pinOrder || 0));

    const handleUnpin = async (rollId: string) => {
        let newPinned = pinnedRolls.filter(r => r.id !== rollId);
        newPinned = newPinned.map((r, i) => ({ ...r, pinOrder: i + 1 }));

        const updatedRolls = rolls.map(r => {
            if (r.id === rollId) return { ...r, pinOrder: null };
            const p = newPinned.find(p => p.id === r.id);
            return p ? p : r;
        });

        setRolls(updatedRolls);
        saveOrder(updatedRolls);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newPinned = [...pinnedRolls];
        [newPinned[index - 1], newPinned[index]] = [newPinned[index], newPinned[index - 1]];
        const reassigned = newPinned.map((r, i) => ({ ...r, pinOrder: i + 1 }));

        const updatedRolls = rolls.map(r => {
            const match = reassigned.find(p => p.id === r.id);
            return match ? match : r;
        });
        setRolls(updatedRolls);
        saveOrder(updatedRolls);
    };

    const handleMoveDown = (index: number) => {
        if (index === pinnedRolls.length - 1) return;
        const newPinned = [...pinnedRolls];
        [newPinned[index + 1], newPinned[index]] = [newPinned[index], newPinned[index + 1]];
        const reassigned = newPinned.map((r, i) => ({ ...r, pinOrder: i + 1 }));

        const updatedRolls = rolls.map(r => {
            const match = reassigned.find(p => p.id === r.id);
            return match ? match : r;
        });
        setRolls(updatedRolls);
        saveOrder(updatedRolls);
    };

    const saveOrder = async (currentRolls: Roll[]) => {
        setIsSaving(true);
        setMessage("");

        const updates = currentRolls.map(r => ({ id: r.id, pinOrder: r.pinOrder }));

        try {
            const res = await fetch("/api/user/pinned", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });

            if (!res.ok) throw new Error("Failed to save pinned rolls order");
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setMessage(err.message || "An error occurred saving pinned rolls.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-card/20 border border-border rounded-xl p-8 shadow-xl mt-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Pin className="w-5 h-5 text-yellow-500" />
                    Pinned Rolls
                </h2>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin text-foreground/50" />}
            </div>
            <p className="text-sm text-foreground/60 mb-6">You can adjust the order of your pinned rolls below. To pin a new roll, visit that roll's editor page.</p>

            {message && <div className="text-sm text-accent mb-4">{message}</div>}

            <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-foreground/50 mb-3 block">Currently Pinned ({pinnedRolls.length}/3)</h3>

                {pinnedRolls.length === 0 && (
                    <div className="w-full border border-dashed border-border/50 rounded-lg p-6 text-center text-foreground/30 text-sm font-mono uppercase tracking-widest">
                        No rolls pinned
                    </div>
                )}

                {pinnedRolls.map((roll, index) => {
                    const imgUrl = roll.coverImage || roll.photos?.[0]?.url;
                    return (
                        <div key={roll.id} className="flex items-center justify-between bg-card border border-border/50 rounded-lg p-3 shadow-md border-t-2 border-t-yellow-500/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black rounded shadow-inner overflow-hidden border border-white/5 flex items-center justify-center shrink-0">
                                    {imgUrl ? (
                                        <img src={imgUrl} className="w-full h-full object-cover opacity-80" alt={roll.title} />
                                    ) : (
                                        <span className="text-[8px] font-mono text-foreground/30 uppercase">Empty</span>
                                    )}
                                </div>
                                <div className="font-semibold text-sm truncate max-w-[150px] sm:max-w-[200px]">{roll.title}</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleMoveUp(index)} disabled={index === 0} className={`p-2 rounded hover:bg-white/5 transition-colors ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'text-foreground/80 hover:text-white'}`}>
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleMoveDown(index)} disabled={index === pinnedRolls.length - 1} className={`p-2 rounded hover:bg-white/5 transition-colors ${index === pinnedRolls.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-foreground/80 hover:text-white'}`}>
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                <button onClick={() => handleUnpin(roll.id)} className="p-2 text-foreground/50 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
