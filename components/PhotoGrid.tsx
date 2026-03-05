"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Loader2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface PhotoGridProps {
    photos: any[];
    onUpdate: (id: string, updates: any) => void;
    onDelete: (id: string) => void;
    onReorderDrag: (sourceIndex: number, destinationIndex: number) => void;
}

export function PhotoGrid({ photos, onUpdate, onDelete, onReorderDrag }: PhotoGridProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="min-h-[200px] flex items-center justify-center text-foreground/20"><Loader2 className="w-5 h-5 animate-spin" /></div>;
    }

    if (photos.length === 0) {
        return (
            <div className="border border-dashed border-border/50 rounded-xl p-16 flex flex-col items-center justify-center text-center bg-card/10">
                <p className="text-foreground/50 font-mono text-sm uppercase tracking-widest">Empty Roll</p>
                <p className="text-sm text-foreground/40 mt-2 max-w-xs">Use the panel on the left to upload frames.</p>
            </div>
        );
    }

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        if (result.source.index === result.destination.index) return;
        onReorderDrag(result.source.index, result.destination.index);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="photo-grid" direction="vertical">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col gap-3 pb-24"
                    >
                        {photos.map((photo, index) => (
                            <Draggable
                                key={photo.id}
                                draggableId={photo.id.toString()}
                                index={index}
                                isDragDisabled={photo.isUploading}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={snapshot.isDragging ? "z-50 scale-[1.02] shadow-2xl" : ""}
                                        style={provided.draggableProps.style}
                                    >
                                        <PhotoCard
                                            photo={photo}
                                            index={index}
                                            onUpdate={onUpdate}
                                            onDelete={onDelete}
                                            dragHandleProps={provided.dragHandleProps}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}

function PhotoCard({ photo, index, onUpdate, onDelete, dragHandleProps }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [caption, setCaption] = useState(photo.caption || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const saveCaption = async () => {
        if (caption === photo.caption) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            await fetch("/api/photos", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: photo.id, caption }),
            });
            onUpdate(photo.id, { caption });
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const deletePhoto = async () => {
        if (!confirm("Are you sure you want to delete this frame?")) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/photos?id=${photo.id}`, { method: "DELETE" });
            onDelete(photo.id);
        } catch (err) {
            console.error(err);
            setIsDeleting(false);
        }
    };

    return (
        <div className={`flex items-center gap-3 sm:gap-4 bg-card/20 hover:bg-card/40 border border-border/50 rounded-lg p-3 transition-all ${isDeleting ? 'opacity-50 scale-95' : ''}`}>
            {!photo.isUploading ? (
                <div
                    {...dragHandleProps}
                    className="p-1 sm:p-2 cursor-grab active:cursor-grabbing text-foreground opacity-30 hover:opacity-80 transition-opacity shrink-0"
                    title="Drag to Reorder"
                >
                    <GripVertical className="w-5 h-5" />
                </div>
            ) : (
                <div {...dragHandleProps} className="w-7 sm:w-9 shrink-0 cursor-not-allowed opacity-30">
                    <GripVertical className="w-5 h-5 ml-1 sm:ml-2" />
                </div>
            )}

            <div className="font-mono text-xs sm:text-sm text-foreground/40 w-4 sm:w-6 text-right select-none shrink-0">
                {index + 1}
            </div>

            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-black rounded overflow-hidden relative flex items-center justify-center border border-white/5">
                {photo.isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                ) : (
                    <img src={photo.url} alt="Frame" className="w-full h-full object-cover mix-blend-screen opacity-90" />
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                {photo.isUploading ? (
                    <div className="text-xs sm:text-sm font-mono tracking-widest uppercase text-accent/70">Developing...</div>
                ) : isEditing ? (
                    <div className="flex gap-2 items-center max-w-md">
                        <input
                            autoFocus
                            className="flex-1 bg-black/40 border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                            value={caption}
                            placeholder="Add a caption..."
                            onChange={(e) => setCaption(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveCaption()}
                            onBlur={saveCaption}
                        />
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-foreground/50 shrink-0" />}
                    </div>
                ) : (
                    <div
                        className="group/caption flex items-center gap-3 cursor-pointer py-2"
                        onClick={() => setIsEditing(true)}
                    >
                        <p className={`text-sm sm:text-base truncate ${photo.caption ? 'text-foreground/90' : 'text-foreground opacity-30 italic'}`}>
                            {photo.caption || "Click to add caption"}
                        </p>
                        <Edit2 className="w-3 h-3 text-foreground opacity-0 group-hover/caption:opacity-30 transition-opacity shrink-0" />
                    </div>
                )}
            </div>

            {!photo.isUploading && (
                <button
                    onClick={deletePhoto}
                    className="p-2 sm:p-3 text-red-500 opacity-50 hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all ml-1 sm:ml-2 shrink-0"
                    title="Delete Frame"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}
