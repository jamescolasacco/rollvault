"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/Button";

export function LogoutButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await signOut({ callbackUrl: "/" });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Sign Out"
                className="group flex flex-col items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors"
            >
                <LogOut className="w-4 h-4 text-foreground opacity-60 group-hover:text-accent group-hover:opacity-100 transition-all" />
            </button>

            {isOpen && (
                <div className="!fixed !inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 h-[100dvh] w-[100dvw] top-0 left-0" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="relative w-full max-w-sm border border-border bg-card shadow-2xl rounded-xl p-8 animate-in fade-in zoom-in duration-300">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-foreground/40 hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 border border-accent/20">
                                <LogOut className="w-5 h-5 text-accent" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight mb-2">Leave the darkroom?</h2>
                            <p className="text-sm text-foreground/60">
                                You are about to sign out of RollVault. Are you sure?
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                variant="safelight"
                                className="w-full"
                                onClick={handleLogout}
                                disabled={isLoading}
                            >
                                {isLoading ? "Signing out..." : "Sign Out"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setIsOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
