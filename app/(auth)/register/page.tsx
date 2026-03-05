"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { Film } from "lucide-react";
import { signIn } from "next-auth/react";

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

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Registration failed");
            }

            // Automatically sign in after registering
            const signInRes = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (signInRes?.error) {
                throw new Error("Login failed after registration");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="absolute top-8 left-6 sm:left-8 z-50">
                <Link href="/" className="inline-flex items-center gap-2 font-serif italic text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors">
                    <Film className="w-5 h-5 text-accent" />
                    RollVault
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
                        <label className="text-sm font-medium text-foreground/80">Username</label>
                        <Input
                            type="text"
                            required
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
