"use client";

import { useState } from "react";
import { FolderHeart, Settings2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ShareIcon } from "@/components/ShareIcon";
import { DeleteArchiveButton } from "@/components/DeleteArchiveButton";

interface EditArchiveClientProps {
    archive: {
        id: string;
        title: string;
        description: string | null;
        rolls: any[];
    };
    username: string;
}

export function EditArchiveClient({ archive, username }: EditArchiveClientProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(archive.title);
    const [description, setDescription] = useState(archive.description || "");
    const [showOnProfile, setShowOnProfile] = useState((archive as any).showOnProfile ?? true);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/archives/${archive.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, showOnProfile }),
            });

            if (res.ok) {
                setIsEditing(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to update archive", error);
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex-1 min-w-0 bg-card p-4 rounded-xl border border-border/50 shadow-sm animate-in fade-in duration-200">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-foreground/50 font-mono">Archive Title</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Archive Title"
                            className="font-bold text-lg"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-foreground/50 font-mono">Description (Optional)</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-1 -ml-1 rounded transition-colors w-fit">
                        <input
                            type="checkbox"
                            checked={showOnProfile}
                            onChange={(e) => setShowOnProfile(e.target.checked)}
                            className="w-4 h-4 rounded border-foreground/20 text-accent focus:ring-accent bg-transparent"
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">Show on Public Profile</span>
                            <span className="text-xs text-foreground/50">If unchecked, this archive is unlisted but accessible via direct link.</span>
                        </div>
                    </label>
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/50">
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={saving} variant="safelight" size="sm">
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button onClick={() => {
                                setTitle(archive.title);
                                setDescription(archive.description || "");
                                setShowOnProfile((archive as any).showOnProfile ?? true);
                                setIsEditing(false);
                            }} disabled={saving} variant="outline" size="sm">
                                Cancel
                            </Button>
                        </div>
                        <DeleteArchiveButton id={archive.id} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 pr-8 group">
            <Link href="/vault" className="text-foreground/50 hover:text-foreground inline-flex items-center gap-2 mb-6 transition-colors text-sm font-mono uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Your Vault
            </Link>
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <FolderHeart className="w-6 h-6 text-accent shrink-0" />
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight truncate">{archive.title}</h1>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShareIcon url={`${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}/${archive.id}`} />
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 hover:bg-white/5 rounded-full text-foreground group/btn transition-colors"
                        title="Edit Archive Details"
                    >
                        <Settings2 className="w-5 h-5 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
            {archive.description && (
                <p className="text-lg text-foreground/60 max-w-2xl text-balance">{archive.description}</p>
            )}
            <p className="text-xs font-mono uppercase tracking-widest text-foreground/40 mt-3">
                {archive.rolls.length} Roll{archive.rolls.length === 1 ? "" : "s"}
            </p>
        </div>
    );
}
