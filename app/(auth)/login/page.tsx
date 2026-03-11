"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PasswordInput } from "@/components/PasswordInput";
import { Film } from "lucide-react";

const EMAIL_RESEND_COOLDOWN_SECONDS = 60;

function parseEmailVerificationRequiredError(error: string): number | null {
    const match = /^EMAIL_VERIFICATION_REQUIRED(?::(\d+))?$/.exec(error);
    if (!match) return null;

    const rawCooldown = match[1]
        ? Number.parseInt(match[1], 10)
        : EMAIL_RESEND_COOLDOWN_SECONDS;
    if (!Number.isFinite(rawCooldown) || rawCooldown < 0) {
        return EMAIL_RESEND_COOLDOWN_SECONDS;
    }
    return rawCooldown;
}

function parseEmailRecoverySentError(error: string): number | null {
    const match = /^EMAIL_RECOVERY_SENT(?::(\d+))?$/.exec(error);
    if (!match) return null;

    const rawCooldown = match[1]
        ? Number.parseInt(match[1], 10)
        : EMAIL_RESEND_COOLDOWN_SECONDS;
    if (!Number.isFinite(rawCooldown) || rawCooldown < 0) {
        return EMAIL_RESEND_COOLDOWN_SECONDS;
    }
    return rawCooldown;
}

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [authStep, setAuthStep] = useState<"credentials" | "emailVerification" | "mfa">("credentials");
    const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (resendCooldownSeconds <= 0) return;
        const timeout = setTimeout(() => {
            setResendCooldownSeconds((current) => Math.max(0, current - 1));
        }, 1000);
        return () => clearTimeout(timeout);
    }, [resendCooldownSeconds]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const emailChangeStatus = new URLSearchParams(window.location.search).get("emailChange");
        if (!emailChangeStatus) return;

        if (emailChangeStatus === "success") {
            setMessage("Email updated successfully. Log in with your new email or your username.");
        } else if (emailChangeStatus === "expired") {
            setError("That email confirmation link expired. Request the email change again from profile settings.");
        } else if (emailChangeStatus === "taken") {
            setError("That email is no longer available. Request a new email change.");
        } else if (emailChangeStatus === "invalid") {
            setError("Invalid email confirmation link.");
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const res = await signIn("credentials", {
            identifier,
            password,
            ...(authStep === "emailVerification" ? { emailCode } : {}),
            ...(authStep === "mfa" ? { totpCode } : {}),
            redirect: false,
        });

        if (res?.error) {
            const emailRecoveryCooldown = parseEmailRecoverySentError(res.error);
            if (emailRecoveryCooldown !== null) {
                setAuthStep("emailVerification");
                setResendCooldownSeconds(emailRecoveryCooldown);
                if (emailRecoveryCooldown >= EMAIL_RESEND_COOLDOWN_SECONDS) {
                    setMessage("Verification code sent to your updated email.");
                } else {
                    setMessage(`Email updated. You can resend in ${emailRecoveryCooldown}s.`);
                }
                setLoading(false);
                return;
            }

            const emailVerificationCooldown = parseEmailVerificationRequiredError(res.error);
            if (emailVerificationCooldown !== null) {
                setAuthStep("emailVerification");
                setResendCooldownSeconds(emailVerificationCooldown);
                if (emailVerificationCooldown >= EMAIL_RESEND_COOLDOWN_SECONDS) {
                    setMessage("Enter the 6-digit code sent to your email to continue.");
                } else {
                    setMessage(`Use the latest code from your email. You can resend in ${emailVerificationCooldown}s.`);
                }
                setLoading(false);
                return;
            }

            if (res.error === "EMAIL_RECOVERY_INVALID") {
                setAuthStep("emailVerification");
                setError("Enter a valid recovery email address.");
                setLoading(false);
                return;
            }

            if (res.error === "EMAIL_RECOVERY_TAKEN") {
                setAuthStep("emailVerification");
                setError("That recovery email is already in use.");
                setLoading(false);
                return;
            }

            if (res.error === "EMAIL_VERIFICATION_INVALID") {
                setAuthStep("emailVerification");
                setError("Invalid or expired email verification code.");
                setLoading(false);
                return;
            }

            if (res.error === "MFA_REQUIRED") {
                setAuthStep("mfa");
                setMessage("Password accepted. Enter your authenticator code to finish logging in.");
                setLoading(false);
                return;
            }

            if (res.error === "MFA_INVALID") {
                setAuthStep("mfa");
                setError("Invalid authenticator code.");
                setLoading(false);
                return;
            }

            const looksLikePhone = /^\+?[0-9()\-\s.]{7,}$/.test(identifier) && !identifier.includes("@");
            if (looksLikePhone) {
                setError("Phone login is no longer supported. Use email or username.");
            } else {
                setError("Invalid email/username or password.");
            }
            setLoading(false);
        } else {
            router.push("/vault");
            router.refresh();
        }
    };

    const handleResendEmailCode = async () => {
        if (resendCooldownSeconds > 0) return;

        setLoading(true);
        setError("");
        setMessage("");

        const res = await signIn("credentials", {
            identifier,
            password,
            redirect: false,
        });

        if (res?.error) {
            const emailVerificationCooldown = parseEmailVerificationRequiredError(res.error);
            if (emailVerificationCooldown !== null) {
                setResendCooldownSeconds(emailVerificationCooldown);
                if (emailVerificationCooldown >= EMAIL_RESEND_COOLDOWN_SECONDS) {
                    setMessage("Verification code sent. Check your email.");
                } else {
                    setMessage(`Please wait ${emailVerificationCooldown}s before requesting another code.`);
                }
                setLoading(false);
                return;
            }

            setError("Could not resend verification code. Re-enter your credentials.");
            setAuthStep("credentials");
            setResendCooldownSeconds(0);
        }
        setLoading(false);
    };

    const handleRecoverEmail = async () => {
        const nextEmail = recoveryEmail.trim();
        if (!nextEmail) return;

        setLoading(true);
        setError("");
        setMessage("");

        const res = await signIn("credentials", {
            identifier,
            password,
            recoveryEmail: nextEmail,
            redirect: false,
        });

        if (res?.error) {
            const emailRecoveryCooldown = parseEmailRecoverySentError(res.error);
            if (emailRecoveryCooldown !== null) {
                setResendCooldownSeconds(emailRecoveryCooldown);
                setRecoveryEmail("");
                if (emailRecoveryCooldown >= EMAIL_RESEND_COOLDOWN_SECONDS) {
                    setMessage("Email updated. Verification code sent to the corrected address.");
                } else {
                    setMessage(`Email updated. You can resend in ${emailRecoveryCooldown}s.`);
                }
                setLoading(false);
                return;
            }

            if (res.error === "EMAIL_RECOVERY_INVALID") {
                setError("Enter a valid recovery email address.");
                setLoading(false);
                return;
            }

            if (res.error === "EMAIL_RECOVERY_TAKEN") {
                setError("That recovery email is already in use.");
                setLoading(false);
                return;
            }

            setError("Could not update email. Go back and re-enter your credentials.");
            setAuthStep("credentials");
            setResendCooldownSeconds(0);
            setLoading(false);
            return;
        }

        router.push("/vault");
        router.refresh();
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
                        <span>Log In</span>
                    </div>
                    <p className="text-sm text-foreground/60">
                        {authStep === "credentials" && "Enter the darkroom"}
                        {authStep === "emailVerification" && "Verify your email to continue"}
                        {authStep === "mfa" && "Complete two-factor authentication"}
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
                    {authStep === "credentials" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Email or Username</label>
                                <Input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="you@example.com or username"
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
                        </>
                    ) : authStep === "emailVerification" ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Email Verification Code</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={loading || resendCooldownSeconds > 0}
                                onClick={handleResendEmailCode}
                            >
                                {resendCooldownSeconds > 0
                                    ? `Resend in ${resendCooldownSeconds}s`
                                    : "Resend Code"}
                            </Button>

                            <div className="pt-2 border-t border-border/50 space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Wrong email? Use a corrected email</label>
                                <Input
                                    type="email"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    placeholder="corrected@example.com"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    disabled={loading || recoveryEmail.trim().length === 0}
                                    onClick={handleRecoverEmail}
                                >
                                    Update Email & Send Code
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground/80">Authenticator Code</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    placeholder="6-digit code"
                                    maxLength={6}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={loading}
                                onClick={() => {
                                    setAuthStep("credentials");
                                    setTotpCode("");
                                    setError("");
                                    setMessage("");
                                }}
                            >
                                Back
                            </Button>
                        </>
                    )}
                    <Button type="submit" variant="safelight" className="w-full" disabled={loading}>
                        {loading ? "Authenticating..." : authStep === "credentials" ? "Log In" : "Verify Code"}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <Link href="/forgot-password" className="text-foreground/60 hover:text-accent transition-colors underline underline-offset-4">
                        Forgot password?
                    </Link>
                </div>

                <div className="mt-6 text-center text-sm text-foreground/60">
                    Not in the vault yet?{" "}
                    <Link href="/register" className="text-foreground hover:text-accent transition-colors underline underline-offset-4">
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
}
