"use client";

import { useState, useRef, useCallback } from "react";
import { User, Camera, Loader2, UploadCloud, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/Button";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";

interface ProfileProps {
    user: {
        username: string;
        bio: string | null;
        avatar: string | null;
    };
}

export default function ProfileEditor({ user }: ProfileProps) {
    const [bio, setBio] = useState(user.bio || "");
    const [avatar, setAvatar] = useState(user.avatar || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cropping State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/user", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bio }),
            });

            if (!res.ok) throw new Error("Failed to update profile");
            setMessage("Profile saved successfully.");
        } catch (err: any) {
            setMessage(err.message || "An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result?.toString() || null);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        setMessage("");

        try {
            // Generate sliced Blob via Canvas
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedBlob) throw new Error("Could not extract crop");

            // Build payload
            const formData = new FormData();
            formData.append("file", croppedBlob, "avatar.jpg");

            const res = await fetch("/api/user/avatar", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to upload avatar");
            const data = await res.json();

            // Clear modal state and update avatar UI
            setImageSrc(null);
            setAvatar(data.user.avatar);
            setMessage("Avatar updated successfully.");
        } catch (err: any) {
            setMessage(err.message || "Upload failed.");
            setImageSrc(null);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <Link href="/dashboard" className="text-foreground/50 hover:text-foreground inline-flex items-center gap-2 mb-2 transition-colors text-sm font-mono uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Vault
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
                <p className="text-foreground/60">Customize how you appear on your public vault.</p>
            </div>

            <div className="bg-card/20 border border-border rounded-xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center gap-6 relative z-10">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 shrink-0 bg-[#050505] rounded-full border border-border/50 flex items-center justify-center overflow-hidden relative shadow-inner cursor-pointer group"
                    >
                        {avatar ? (
                            <img src={avatar} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" alt="Avatar preview" />
                        ) : (
                            <User className="w-8 h-8 text-foreground opacity-20 group-hover:opacity-50 transition-opacity" />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <UploadCloud className="w-6 h-6 text-white" />}
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={onFileChange}
                    />

                    <div>
                        <h3 className="font-semibold text-lg">@{user.username}</h3>
                        <a
                            href={`/u/${user.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-mono text-accent hover:underline mt-1 inline-flex items-center gap-1"
                        >
                            View Public Page <Camera className="w-3 h-3" />
                        </a>
                        <p className="text-xs text-foreground/50 mt-1">Click the avatar to upload a new one.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Analog photographer based in..."
                            rows={4}
                            className="w-full bg-background/50 border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button type="submit" variant="safelight" disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isSaving ? "Saving..." : "Save Bio"}
                        </Button>
                        {message && (
                            <span className={`text-sm ${message.includes("success") ? "text-green-500/80" : "text-accent"}`}>
                                {message}
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* Cropper Modal Overlay */}
            {imageSrc && (
                <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in">
                    <div className="w-full max-w-lg bg-card border border-border rounded-xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border/50">
                            <h3 className="font-bold tracking-tight">Align Avatar</h3>
                            <button onClick={() => setImageSrc(null)} className="text-foreground/50 hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative w-full h-[400px] bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-4 space-y-4 bg-card/50">
                            <div>
                                <label className="text-xs font-mono uppercase tracking-widest text-foreground/50 mb-2 block">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-accent bg-border/50 h-1 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setImageSrc(null)} disabled={isUploading}>
                                    Cancel
                                </Button>
                                <Button variant="safelight" onClick={handleAvatarUpload} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {isUploading ? "Uploading..." : "Save Crop"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
