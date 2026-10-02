import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  UserRound,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  MailCheck,
  RotateCw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import {
  requestPasswordReset,
  confirmPasswordReset,
  requestEmailVerification,
  verifyEmail,
  type AccountRole,
} from "@/lib/auth.functions";

export type LoginSearch = {
  role?: "candidate" | "employer" | undefined;
  redirect?: string | undefined;
  token?: string | undefined;
  email?: string | undefined;
  mode?: "login" | "register" | "forgot_password" | "verify_email" | undefined;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    role: search["role"] === "employer" ? "employer" : "candidate",
    redirect: isSafeReturnTo(search["redirect"]) ? search["redirect"] : undefined,
    token: typeof search["token"] === "string" ? search["token"] : undefined,
    email: typeof search["email"] === "string" ? search["email"] : undefined,
    mode:
      search["mode"] === "verify_email"
        ? "verify_email"
        : search["mode"] === "forgot_password"
          ? "forgot_password"
          : search["mode"] === "register"
            ? "register"
            : undefined,
  }),
  component: LoginPage,
});

function isSafeReturnTo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/login")
  );
}

function LoginPage() {
  const {
    role: searchRole,
    redirect,
    token: searchToken,
    email: searchEmail,
    mode: searchMode,
  } = Route.useSearch();
  const initialRole: AccountRole = searchRole === "employer" ? "employer" : "candidate";
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const requestResetFn = useServerFn(requestPasswordReset);
  const confirmResetFn = useServerFn(confirmPasswordReset);
  const requestVerificationFn = useServerFn(requestEmailVerification);
  const verifyEmailFn = useServerFn(verifyEmail);

  const [role, setRole] = useState<AccountRole>(initialRole);
  const [mode, setMode] = useState<"login" | "register" | "forgot_password" | "verify_email">(
    searchMode || (searchToken ? "forgot_password" : "login"),
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchEmail || "");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState(searchToken || "");
  const [resetSent, setResetSent] = useState(Boolean(searchToken));
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const result =
        mode === "register"
          ? await register({ fullName, email, password, role })
          : await login({ email, password, role });

      if (result.requiresVerification) {
        setMode("verify_email");
        setError("");
        setSuccessMsg(
          result.message ||
            result.error ||
            "Please enter the 6-digit verification code sent to your email.",
        );
        return;
      }

      if (!result.ok || !result.user) {
        setError(result.error ?? "We couldn't sign you in.");
        return;
      }
      if (redirect) {
        window.location.assign(redirect);
        return;
      }
      navigate({ to: result.user.role === "employer" ? "/employer" : "/dashboard" });
    } catch {
      setError("We couldn't complete your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await verifyEmailFn({
        data: {
          email: email.trim(),
          code: verificationCode.trim(),
        },
      });
      if (!res.ok) {
        setError(res.error ?? "Invalid or expired verification code.");
        return;
      }
      setSuccessMsg("Email verified successfully! Redirecting...");
      setTimeout(() => {
        if (redirect) {
          window.location.assign(redirect);
          return;
        }
        window.location.assign(res.user?.role === "employer" ? "/employer" : "/dashboard");
      }, 600);
    } catch {
      setError("Failed to verify email code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError("Please enter your email address to receive a code.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await requestVerificationFn({ data: { email: email.trim() } });
      if (res.ok) {
        setSuccessMsg(res.message || "A fresh 6-digit verification code has been sent.");
      }
    } catch {
      setError("Could not resend verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPasswordResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await requestResetFn({ data: { email } });
      if (res.ok) {
        setResetSent(true);
        setSuccessMsg(res.message);
      }
    } catch {
      setError("Unable to process password reset request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPasswordResetConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await confirmResetFn({
        data: {
          token: resetToken.trim(),
          newPassword,
        },
      });
      if (!res.ok || !res.user) {
        setError(res.error ?? "Could not reset password. Token may be invalid or expired.");
        return;
      }
      setSuccessMsg("Password reset successfully! Redirecting...");
      setTimeout(() => {
        window.location.assign(res.user.role === "employer" ? "/employer" : "/dashboard");
      }, 600);
    } catch {
      setError("Failed to confirm password reset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-8">
        <h1 className="font-serif text-3xl text-foreground">
          {mode === "register"
            ? "Create your account"
            : mode === "forgot_password"
              ? "Reset your password"
              : mode === "verify_email"
                ? "Verify your email"
                : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "register"
            ? "Choose your portal and set up a secure account."
            : mode === "forgot_password"
              ? "Enter your account email to receive a password reset code."
              : mode === "verify_email"
                ? "Enter the 6-digit verification code sent to your email address."
                : "Choose the portal you need, then sign in with your credentials."}
        </p>

        {mode !== "forgot_password" && mode !== "verify_email" && (
          <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="Choose a portal">
            {(["candidate", "employer"] as const).map((item) => {
              const active = role === item;
              const Icon = item === "candidate" ? UserRound : Building2;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-foreground bg-[#7BD3C2] text-[#141817] font-semibold"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item === "candidate" ? "User portal" : "Employer portal"}
                </button>
              );
            })}
          </div>
        )}

        {/* Regular Login & Register Forms */}
        {mode !== "forgot_password" && mode !== "verify_email" && (
          <form className="mt-6 space-y-4" onSubmit={submitAuth} noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="full-name" className="text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="full-name"
                  className="mt-1.5"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                className="mt-1.5"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_password");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                className="mt-1.5"
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait…"
                : mode === "register"
                  ? `Create ${role} account`
                  : `Sign in as ${role === "candidate" ? "user" : "employer"}`}
            </Button>
          </form>
        )}

        {/* Password Reset Workflow */}
        {mode === "forgot_password" && (
          <div className="mt-6 space-y-4">
            {!resetSent ? (
              <form onSubmit={submitPasswordResetRequest} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="text-sm font-medium">
                    Account Email
                  </label>
                  <Input
                    id="reset-email"
                    className="mt-1.5"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending reset link…" : "Send Reset Email"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitPasswordResetConfirm} className="space-y-4">
                {successMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <p className="font-semibold">Check your email</p>
                      <p className="mt-0.5 text-xs leading-relaxed">{successMsg}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-token" className="text-sm font-medium">
                    Reset Token / Code
                  </label>
                  <Input
                    id="reset-token"
                    className="mt-1.5 font-mono text-xs"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="64-character reset token"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    className="mt-1.5"
                    type="password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <KeyRound className="size-4 mr-2" />
                  {isSubmitting ? "Updating password…" : "Set New Password & Sign In"}
                </Button>
              </form>
            )}

            <button
              type="button"
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
                setResetSent(false);
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* Email Verification Workflow */}
        {mode === "verify_email" && (
          <div className="mt-6 space-y-4">
            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-semibold">Verification Code Sent</p>
                  <p className="mt-0.5 text-xs leading-relaxed">{successMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={submitVerification} className="space-y-4">
              <div>
                <label htmlFor="verify-email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="verify-email"
                  className="mt-1.5"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="verify-code" className="text-sm font-medium">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={isSubmitting}
                    className="text-xs text-brand hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <RotateCw className="size-3" />
                    Resend code
                  </button>
                </div>
                <Input
                  id="verify-code"
                  className="mt-1.5 text-center font-mono tracking-widest text-lg font-bold"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  autoComplete="one-time-code"
                  required
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Check your inbox (or server console in development) for the 6-digit code.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <MailCheck className="size-4 mr-2" />
                {isSubmitting ? "Verifying code…" : "Verify Email & Sign In"}
              </Button>
            </form>

            <button
              type="button"
              className="mt-4 w-full text-center text-sm font-medium text-muted-foreground underline hover:text-foreground"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMsg("");
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* Toggle between Register and Sign In */}
        {mode !== "forgot_password" && mode !== "verify_email" && (
          <button
            type="button"
            className="mt-5 w-full text-sm font-medium text-muted-foreground underline hover:text-foreground"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
              setSuccessMsg("");
            }}
          >
            {mode === "register"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        )}
      </div>
    </div>
  );
}
