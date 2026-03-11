"use client";

import { useState } from "react";
import Link from "next/link";
import { Film } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setMessage(data.message);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Could not process request.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-8 left-6 sm:left-8 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-serif italic text-xl tracking-wide text-foreground/80 hover:text-foreground transition-colors"
        >
          <img src="/logo.png" alt="RollVault" className="h-6 sm:h-7 w-auto" />
        </Link>
      </div>

      <div className="w-full max-w-sm border border-border bg-card/50 backdrop-blur-sm p-8 rounded-xl z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 font-serif italic text-2xl tracking-wide mb-2 text-foreground/90">
            <Film className="w-6 h-6 text-accent" />
            <span>Reset Password</span>
          </div>
          <p className="text-sm text-foreground/60 text-center">
            Enter your email or username.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-accent/10 border border-accent/20 text-accent text-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              Email or Username
            </label>
            <Input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" variant="safelight" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-foreground/60">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-foreground hover:text-accent transition-colors underline underline-offset-4"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
