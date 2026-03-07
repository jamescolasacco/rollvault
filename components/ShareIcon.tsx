"use client";

import { useState } from "react";
import { Share, Check } from "lucide-react";

interface ShareIconProps {
    url?: string;
    title?: string;
}

export function ShareIcon({ url, title = "Share URL" }: ShareIconProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            const shareUrl = url || window.location.href;

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                // Fallback for non-HTTPS local development (e.g. mobile testing on LAN)
                const textArea = document.createElement("textarea");
                textArea.value = shareUrl;
                textArea.style.position = "absolute";
                textArea.style.left = "-999999px";
                document.body.prepend(textArea);
                textArea.select();
                try {
                    document.execCommand("copy");
                } catch (error) {
                    console.error("Fallback copy failed", error);
                } finally {
                    textArea.remove();
                }
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="p-2 hover:bg-white/5 rounded-full text-foreground group/btn transition-colors relative"
            title={title}
        >
            {copied ? (
                <Check className="w-5 h-5 opacity-80 text-green-500 transition-all" />
            ) : (
                <Share className="w-5 h-5 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
            )}

            {/* Tooltip confirmation */}
            {copied && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
                    Copied!
                </div>
            )}
        </button>
    );
}
