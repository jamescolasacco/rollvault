"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { Film } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Registration failed");
            }

            const loginParams = new URLSearchParams({
                registered: "1",
                identifier: email.trim(),
            });
            router.push(`/login?${loginParams.toString()}`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Registration failed";
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="absolute top-8 left-6 sm:left-8 z-50">
                <Link href="/" className="inline-flex items-center gap-2 font-serif italic text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors">
                    <img src="/logo.png" alt="RollVault" className="h-6 sm:h-7 w-auto" />
                </Link>
            </div>

            <div className="w-full max-w-sm border border-border bg-card/50 backdrop-blur-sm p-8 rounded-xl z-10 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="flex items-center gap-2 font-serif italic text-2xl tracking-wide mb-2 text-foreground/90">
                        <Film className="w-6 h-6 text-accent" />
                        <span>Sign Up</span>
                    </div>
                    <p className="text-sm text-foreground/60">Start your vault</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded bg-accent/10 border border-accent/20 text-accent text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">Email</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">Username (3-15 characters, no spaces)</label>
                        <Input
                            type="text"
                            required
                            minLength={3}
                            maxLength={15}
                            pattern="^[a-zA-Z0-9._]{3,15}$"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="filmlover99"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">Password</label>
                        <PasswordInput
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/80">Confirm Password</label>
                        <PasswordInput
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <Button type="submit" variant="safelight" className="w-full" disabled={loading}>
                        {loading ? "Creating..." : "Sign Up"}
                    </Button>
                    <p className="text-xs text-foreground/50 text-center">
                        Email verification is required before image uploads.
                    </p>
                </form>

                <div className="mt-6 text-center text-sm text-foreground/60">
                    Already have an account?{" "}
                    <Link href="/login" className="text-foreground hover:text-accent transition-colors underline underline-offset-4">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
