"use client";

import { useState, useRef } from "react";
import { User, Camera, Loader2, UploadCloud, ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import Link from "next/link";

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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setMessage("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/user/avatar", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed to upload avatar");
            const data = await res.json();

            // The API returns the updated user with the new file URL
            setAvatar(data.user.avatar);
            setMessage("Avatar updated successfully.");
        } catch (err: any) {
            setMessage(err.message || "Upload failed.");
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
                        onChange={handleAvatarUpload}
                    />

                    <div>
                        <h3 className="font-semibold text-lg">@{user.username}</h3>
                        <a
                            href={`/${user.username}`}
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
        </div>
    );
}
