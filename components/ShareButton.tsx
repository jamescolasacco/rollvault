"use client";

import { useState } from "react";
import { Share, Check } from "lucide-react";
import { Button } from "@/components/Button";

interface ShareButtonProps {
    title?: string;
    variant?: "default" | "outline" | "ghost" | "safelight";
    className?: string;
}

export function ShareButton({ title = "Share to Web", variant = "safelight", className = "" }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            // Write current browser URL to the clipboard
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    return (
        <Button
            variant={variant}
            onClick={handleShare}
            className={`inline-flex items-center gap-2 font-mono uppercase tracking-widest text-xs h-9 ${className}`}
        >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share className="w-4 h-4" />}
            {copied ? "Link Copied" : title}
        </Button>
    );
}
