"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateArchiveForm() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/archives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (res.ok) {
                setIsOpen(false);
                setTitle("");
                setDescription("");
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button variant="safelight" className="gap-2" onClick={() => setIsOpen(true)}>
                <Plus className="w-4 h-4" /> Create Archive
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-card w-full sm:w-auto p-4 rounded-xl border border-border shadow-lg flex flex-col sm:flex-row gap-3 items-end isolate animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full sm:w-48 space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/50 font-mono">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summer 2026" required autoFocus />
            </div>
            <div className="w-full sm:w-64 space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/50 font-mono">Description (Optional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Trip to the mountains..." />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button type="submit" variant="safelight" disabled={loading} className="flex-1 sm:flex-none">
                    {loading ? "..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading} className="flex-1 sm:flex-none">
                    Cancel
                </Button>
            </div>
        </form>
    );
}
