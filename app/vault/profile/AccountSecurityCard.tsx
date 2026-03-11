"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

interface AccountSecurityCardProps {
  user: {
    email: string;
    emailVerified: boolean;
    totpEnabled: boolean;
  };
}

export default function AccountSecurityCard({ user }: AccountSecurityCardProps) {
  const [email, setEmail] = useState(user.email);
  const [emailVerified, setEmailVerified] = useState(user.emailVerified);
  const [totpEnabled, setTotpEnabled] = useState(user.totpEnabled);

  const [emailCode, setEmailCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [mfaSetupSecret, setMfaSetupSecret] = useState("");
  const [mfaSetupUri, setMfaSetupUri] = useState("");
  const [mfaSetupCode, setMfaSetupCode] = useState("");
  const [isMfaSettingUp, setIsMfaSettingUp] = useState(false);
  const [isMfaEnabling, setIsMfaEnabling] = useState(false);
  const [disableMfaPassword, setDisableMfaPassword] = useState("");
  const [disableMfaCode, setDisableMfaCode] = useState("");
  const [isMfaDisabling, setIsMfaDisabling] = useState(false);

  const clearStatus = () => {
    setMessage("");
    setError("");
  };

  const handleContactSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();
    setIsSaving(true);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to save contact settings.");
      }

      setEmail(data.user.email);
      setEmailVerified(Boolean(data.user.emailVerified));
      setTotpEnabled(Boolean(data.user.totpEnabled));

      if (data.pendingEmailChange) {
        setMessage(`Confirmation sent to ${data.pendingEmailChange}. Your current email remains active until confirmed.`);
      } else {
        setMessage("Email updated.");
      }

      if (Array.isArray(data.deliveryWarnings) && data.deliveryWarnings.length > 0) {
        setError(data.deliveryWarnings.join(" "));
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to save contact settings.";
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const requestEmailCode = async () => {
    clearStatus();
    setIsCodeSending(true);
    try {
      const res = await fetch("/api/auth/verification/request", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to send verification code.");
      }
      setMessage(data.message || "Verification code sent.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to send verification code.";
      setError(errorMessage);
    } finally {
      setIsCodeSending(false);
    }
  };

  const verifyEmailCode = async () => {
    clearStatus();
    setIsVerifyingEmail(true);

    try {
      const res = await fetch("/api/auth/verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      setEmailVerified(Boolean(data.verification.emailVerified));
      setEmailCode("");
      setMessage(data.message || "Email verified.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed.";
      setError(errorMessage);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const startMfaSetup = async () => {
    clearStatus();
    setIsMfaSettingUp(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not start authenticator setup.");
      }

      setMfaSetupSecret(data.secret || "");
      setMfaSetupUri(data.otpauthUrl || "");
      setMfaSetupCode("");
      setMessage(data.message || "Authenticator setup key generated.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not start authenticator setup.";
      setError(errorMessage);
    } finally {
      setIsMfaSettingUp(false);
    }
  };

  const enableMfa = async () => {
    clearStatus();
    setIsMfaEnabling(true);
    try {
      const res = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaSetupCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not enable authenticator app.");
      }

      setTotpEnabled(true);
      setMfaSetupSecret("");
      setMfaSetupUri("");
      setMfaSetupCode("");
      setMessage(data.message || "Authenticator app enabled.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not enable authenticator app.";
      setError(errorMessage);
    } finally {
      setIsMfaEnabling(false);
    }
  };

  const disableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();
    setIsMfaDisabling(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disableMfaPassword,
          code: disableMfaCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not disable authenticator app.");
      }

      setTotpEnabled(false);
      setDisableMfaPassword("");
      setDisableMfaCode("");
      setMessage(data.message || "Authenticator app disabled.");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Could not disable authenticator app.";
      setError(errorMessage);
    } finally {
      setIsMfaDisabling(false);
    }
  };

  const verificationBadgeClasses = (verified: boolean) =>
    verified
      ? "bg-green-500/20 text-green-400 border border-green-500/30"
      : "bg-amber-500/15 text-amber-300 border border-amber-500/30";

  return (
    <div className="bg-card/20 border border-border rounded-xl p-8 shadow-xl space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Account Security</h2>
        <p className="text-sm text-foreground/60">
          Email verification is required for uploads. Authenticator app MFA is optional.
        </p>
      </div>

      {(message || error) && (
        <div
          className={`p-3 rounded text-sm ${
            error
              ? "bg-accent/10 border border-accent/20 text-accent"
              : "bg-green-500/10 border border-green-500/20 text-green-400"
          }`}
        >
          {error || message}
        </div>
      )}

      <form onSubmit={handleContactSave} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <Button type="submit" variant="outline" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Email"}
        </Button>
      </form>

      <div className="border border-border/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Email Verification</p>
          <span className={`text-xs px-2 py-1 rounded-full font-mono ${verificationBadgeClasses(emailVerified)}`}>
            {emailVerified ? "VERIFIED" : "PENDING"}
          </span>
        </div>
        {!emailVerified && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                inputMode="numeric"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
              />
              <Button
                type="button"
                variant="safelight"
                disabled={isVerifyingEmail || emailCode.length !== 6}
                onClick={verifyEmailCode}
              >
                {isVerifyingEmail ? "Verifying..." : "Verify"}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" disabled={isCodeSending} onClick={requestEmailCode}>
                {isCodeSending ? "Sending..." : "Send Email Code"}
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="border border-border/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Authenticator App (Optional)</p>
            <p className="text-xs text-foreground/60 mt-1">
              Use Google Authenticator, 1Password, or Authy for TOTP-based MFA.
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-mono ${verificationBadgeClasses(totpEnabled)}`}>
            {totpEnabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>

        {!totpEnabled ? (
          <div className="space-y-4">
            {!mfaSetupSecret ? (
              <Button type="button" variant="outline" disabled={isMfaSettingUp} onClick={startMfaSetup}>
                {isMfaSettingUp ? "Generating..." : "Generate Setup Key"}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground/70">
                  Add this key in your authenticator app and enter a fresh 6-digit code to enable:
                </p>
                <div className="bg-black/30 border border-border rounded-md p-3">
                  <p className="text-xs font-mono break-all">{mfaSetupSecret}</p>
                </div>
                {mfaSetupUri && (
                  <a
                    href={mfaSetupUri}
                    className="text-xs text-accent underline underline-offset-4 break-all"
                  >
                    otpauth:// link (for compatible apps)
                  </a>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={mfaSetupCode}
                    onChange={(e) => setMfaSetupCode(e.target.value)}
                    placeholder="6-digit authenticator code"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="safelight"
                    disabled={isMfaEnabling || mfaSetupCode.length !== 6}
                    onClick={enableMfa}
                  >
                    {isMfaEnabling ? "Enabling..." : "Enable Authenticator"}
                  </Button>
                </div>
                <Button type="button" variant="outline" disabled={isMfaSettingUp} onClick={startMfaSetup}>
                  Regenerate Key
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={disableMfa} className="space-y-3">
            <p className="text-sm text-foreground/70">
              To disable MFA, enter your password and current authenticator code.
            </p>
            <Input
              type="password"
              value={disableMfaPassword}
              onChange={(e) => setDisableMfaPassword(e.target.value)}
              placeholder="Current password"
              required
            />
            <Input
              type="text"
              inputMode="numeric"
              value={disableMfaCode}
              onChange={(e) => setDisableMfaCode(e.target.value)}
              placeholder="Current 6-digit code"
              maxLength={6}
              required
            />
            <Button type="submit" variant="outline" disabled={isMfaDisabling}>
              {isMfaDisabling ? "Disabling..." : "Disable Authenticator"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
