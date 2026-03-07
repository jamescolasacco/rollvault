"use client";

import { useState, useRef } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ArrowLeft, Settings2, Loader2, UploadCloud, Camera, Pin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ShareIcon } from "@/components/ShareIcon";
import { useRouter } from "next/navigation";

interface RollClientProps {
    roll: any;
    archives: any[];
}

export default function RollEditorClient({ roll, archives }: RollClientProps) {
    const router = useRouter();
    const [photos, setPhotos] = useState(roll.photos);

    // Metadata Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState(roll.title);
    const [editDesc, setEditDesc] = useState(roll.description || "");
    const [editDate, setEditDate] = useState(roll.dateDeveloped ? new Date(roll.dateDeveloped).toISOString().split('T')[0] : new Date(roll.createdAt).toISOString().split('T')[0]);
    const [editArchiveIds, setEditArchiveIds] = useState<string[]>(roll.archives.map((a: any) => a.id));
    const [editCoverImage, setEditCoverImage] = useState(roll.coverImage || "");
    const [editShowOnProfile, setEditShowOnProfile] = useState(roll.showOnProfile ?? true);
    const [editIsPinned, setEditIsPinned] = useState(roll.pinOrder !== null);
    const [isCoverUploading, setIsCoverUploading] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Current displayed metadata
    const [metadata, setMetadata] = useState({
        title: roll.title,
        description: roll.description,
        dateDeveloped: roll.dateDeveloped,
        archives: roll.archives,
        showOnProfile: roll.showOnProfile ?? true
    });

    const handleSaveMetadata = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/rolls/${roll.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDesc,
                    dateDeveloped: editDate ? new Date(editDate).toISOString() : null,
                    archiveIds: editArchiveIds,
                    showOnProfile: editShowOnProfile
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setMetadata({
                    title: updated.title,
                    description: updated.description,
                    dateDeveloped: updated.dateDeveloped,
                    archives: updated.archives,
                    showOnProfile: updated.showOnProfile
                });

                // Keep the editor's pending state in sync with truth!
                setEditTitle(updated.title);
                setEditDesc(updated.description || "");
                if (updated.dateDeveloped) {
                    setEditDate(new Date(updated.dateDeveloped).toISOString().split('T')[0]);
                } else {
                    setEditDate(new Date(roll.createdAt).toISOString().split('T')[0]);
                }
                setEditArchiveIds(updated.archives.map((a: any) => a.id));
                setEditShowOnProfile(updated.showOnProfile);

                setIsEditing(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePin = async () => {
        if (!metadata.showOnProfile) {
            alert("This roll must be set to 'Show on Public Profile' before it can be pinned.");
            return;
        }

        const newPinnedState = !editIsPinned;
        setIsPinning(true);
        try {
            const res = await fetch(`/api/rolls/${roll.id}/pin`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: newPinnedState })
            });
            if (res.ok) {
                setEditIsPinned(newPinnedState);
            } else {
                const text = await res.text();
                alert(text || "Failed to update pin state.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred saving pin state.");
        } finally {
            setIsPinning(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCoverUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/rolls/${roll.id}/cover`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();

            // Instantly update the UI states
            setEditCoverImage(data.roll.coverImage);
            setMetadata(prev => ({ ...prev, coverImage: data.roll.coverImage }));

        } catch (error) {
            console.error(error);
        } finally {
            setIsCoverUploading(false);
            if (coverInputRef.current) coverInputRef.current.value = "";
        }
    };

    const handleRemoveCover = async () => {
        if (!editCoverImage || !window.confirm("Remove custom cover? This will revert your Roll's thumbnail back to using the first frame of your grid.")) return;
        setIsCoverUploading(true);
        try {
            const res = await fetch(`/api/rolls/${roll.id}/cover`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            setEditCoverImage("");
            setMetadata(prev => ({ ...prev, coverImage: "" as any }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsCoverUploading(false);
        }
    };

    const handlePhotoUpdate = (id: string, updates: Partial<typeof photos[0]>) => {
        setPhotos((prev: any) => prev.map((p: any) => p.id === id ? { ...p, ...updates } : p));
    };

    const handlePhotoDelete = async (id: string) => {
        // Optimistically remove from UI
        setPhotos((prev: any) => prev.filter((p: any) => p.id !== id));

        // Execute physical file sweep on backend
        if (!id.startsWith("temp-")) {
            fetch(`/api/photos/${id}`, { method: "DELETE" }).catch(console.error);
        }
    };

    const handleDeleteRoll = async () => {
        if (!window.confirm("Are you sure you want to delete this Roll? ALL associated photos will be permanently deleted from the system.")) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/rolls/${roll.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/vault");
            }
        } catch (e) {
            console.error(e);
            setIsSaving(false);
        }
    };

    const handleReorderDrag = (sourceIndex: number, destinationIndex: number) => {
        const newPhotos = Array.from(photos);
        const [moved] = newPhotos.splice(sourceIndex, 1);
        newPhotos.splice(destinationIndex, 0, moved);

        const orderedPhotos = newPhotos.map((p: any, i) => ({ ...p, orderIndex: i }));
        setPhotos(orderedPhotos);

        fetch("/api/photos/reorder", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                updates: orderedPhotos
                    .filter(p => !p.isUploading) // Don't try to bulk update temps
                    .map(p => ({ id: p.id, orderIndex: p.orderIndex }))
            }),
        });
    };

    const handleUploadStart = (count: number) => {
        const temps = Array.from({ length: count }).map((_, i) => ({
            id: `temp-${Date.now()}-${i}`,
            url: '',
            isUploading: true,
            orderIndex: photos.length + i,
        }));
        setPhotos((prev: any) => [...prev, ...temps]);
    };

    const handleUploadSuccess = (newPhotos: any[]) => {
        setPhotos((prev: any) => {
            const filtered = prev.filter((p: any) => !p.isUploading);
            return [...filtered, ...newPhotos];
        });
    };

    const parentArchives = archives.filter((a: any) => editArchiveIds.includes(a.id));
    const isForcedPrivate = parentArchives.some((a: any) => !a.showOnProfile);

    const derivedShowOnProfile = isForcedPrivate ? false : editShowOnProfile;

    return (
        <div className="max-w-5xl mx-auto mt-4 sm:mt-8 space-y-8 sm:space-y-12">
            <div className="flex items-start justify-between relative">
                {isEditing ? (
                    <div className="flex-1 max-w-2xl bg-card border border-border rounded-xl p-4 sm:p-6 shadow-xl space-y-4 mx-auto w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-mono text-sm uppercase tracking-widest text-foreground/50">Edit Roll Details</h3>
                            <div className="flex items-center gap-4">
                                <div
                                    className="relative w-16 h-12 bg-black rounded overflow-hidden shadow-inner cursor-pointer group flex-shrink-0 border border-white/10 ring-1 ring-transparent hover:ring-accent/50 transition-all"
                                    onClick={() => coverInputRef.current?.click()}
                                    title="Change Cover Image"
                                >
                                    {editCoverImage || photos[0]?.url ? (
                                        <img src={editCoverImage || photos[0]?.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" alt="Cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                            <Camera className="w-4 h-4 text-white opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        {isCoverUploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <UploadCloud className="w-4 h-4 text-white" />}
                                    </div>
                                    <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
                                </div>
                                {editCoverImage && (
                                    <button
                                        onClick={handleRemoveCover}
                                        disabled={isCoverUploading}
                                        className="text-xs font-mono text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-widest disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-foreground/60">Title</label>
                            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Roll Title" className="font-bold text-lg" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-foreground/60">Description</label>
                            <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Summer trip to Italy..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase text-foreground/60">Date Developed</label>
                            <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-mono uppercase text-foreground/60">Vault Archives</label>
                            {archives.length === 0 ? (
                                <p className="text-sm text-foreground/40 italic">No archives created yet.</p>
                            ) : (
                                <div className="space-y-2 border border-border/50 rounded-md p-3 bg-background max-h-48 overflow-y-auto">
                                    {archives.map((archive) => (
                                        <label key={archive.id} className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={editArchiveIds.includes(archive.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setEditArchiveIds(prev => [...prev, archive.id]);
                                                    else setEditArchiveIds(prev => prev.filter(id => id !== archive.id));
                                                }}
                                                className="w-4 h-4 rounded border-foreground/20 text-accent focus:ring-accent bg-transparent"
                                            />
                                            <span className="text-sm text-foreground/80 group-hover:text-foreground">{archive.title}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <label className="text-xs font-mono uppercase text-foreground/60">Visibility</label>
                            <label className={`flex items-center gap-3 p-2 -ml-2 rounded transition-colors w-fit ${isForcedPrivate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group hover:bg-white/5'}`}>
                                <input
                                    type="checkbox"
                                    checked={derivedShowOnProfile}
                                    onChange={(e) => setEditShowOnProfile(e.target.checked)}
                                    disabled={isForcedPrivate}
                                    className="w-4 h-4 rounded border-foreground/20 text-accent focus:ring-accent bg-transparent disabled:opacity-50"
                                />
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${isForcedPrivate ? 'text-foreground/90' : 'text-foreground/90 group-hover:text-foreground'}`}>Show on Public Profile</span>
                                    <span className="text-xs text-foreground/50">
                                        {isForcedPrivate
                                            ? "Visibility is locked because it belongs to an unlisted Archive."
                                            : "If unchecked, this Roll is unlisted but still accessible via direct link."}
                                    </span>
                                </div>
                            </label>

                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-3">
                                <Button size="sm" variant="safelight" onClick={handleSaveMetadata} disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                    setIsEditing(false);
                                    setEditShowOnProfile(metadata.showOnProfile);
                                }} disabled={isSaving}>
                                    Cancel
                                </Button>
                            </div>
                            <Button size="sm" variant="outline" onClick={handleDeleteRoll} disabled={isSaving} className="text-red-500 hover:text-red-400 border-red-900/50 hover:border-red-500/50">
                                Delete Roll
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 pr-8 group">
                            <Link href="/vault" className="text-foreground/50 hover:text-foreground inline-flex items-center gap-2 mb-6 transition-colors text-sm font-mono uppercase tracking-widest">
                                <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Your Vault
                            </Link>
                            <div className="flex items-center gap-4 mb-4">
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center gap-3">
                                    {metadata.title}
                                    <button
                                        onClick={handleTogglePin}
                                        disabled={isPinning}
                                        title={editIsPinned ? "Unpin from Public Profile" : "Pin to Public Profile"}
                                        className={`flex items-center justify-center rounded-full p-2.5 transition-colors ${editIsPinned
                                            ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                            : 'bg-white/5 text-foreground/40 hover:bg-white/10 hover:text-foreground/80'
                                            } ${isPinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isPinning ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Pin className={`w-5 h-5 md:w-6 md:h-6 ${editIsPinned ? 'fill-yellow-500/20' : ''}`} />}
                                    </button>
                                </h1>

                                <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <ShareIcon url={`${typeof window !== 'undefined' ? window.location.origin : ''}/u/${roll.user.username}/${roll.slug || roll.id}`} />
                                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/5 rounded-full text-foreground group/btn" title="Edit Roll Details">
                                        <Settings2 className="w-5 h-5 opacity-60 sm:opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                            {metadata.description && (
                                <p className="text-lg text-foreground/60 max-w-2xl text-balance">{metadata.description}</p>
                            )}
                        </div>
                        <div className="hidden sm:flex flex-col items-end text-right shrink-0">
                            <span className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-1">Developed</span>
                            <span className="text-foreground/80 font-medium whitespace-nowrap">
                                {metadata.dateDeveloped
                                    ? new Date(metadata.dateDeveloped).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                    : new Date(roll.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                }
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form Area */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <UploadDropzone
                            rollId={roll.id}
                            onUploadStart={handleUploadStart}
                            onUploadSuccess={handleUploadSuccess}
                        />
                    </div>
                </div>

                {/* Grid of Photos */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Organizer</h2>
                        <span className="text-sm font-mono text-foreground/80 bg-card border border-border px-3 py-1 rounded-full">
                            {photos.filter((p: any) => !p.isUploading).length} Frames
                        </span>
                    </div>

                    <PhotoGrid
                        photos={photos}
                        onUpdate={handlePhotoUpdate}
                        onDelete={handlePhotoDelete}
                        onReorderDrag={handleReorderDrag}
                    />
                </div>
            </div>
        </div>
    );
}
