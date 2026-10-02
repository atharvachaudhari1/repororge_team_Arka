import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Building2, UserRound, KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import {
  requestPasswordReset,
  confirmPasswordReset,
  type AccountRole,
} from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "employer" ? ("employer" as const) : ("candidate" as const),
    redirect: isSafeReturnTo(search.redirect) ? search.redirect : undefined,
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
  const { role: initialRole, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const requestResetFn = useServerFn(requestPasswordReset);
  const confirmResetFn = useServerFn(confirmPasswordReset);

  const [role, setRole] = useState<AccountRole>(initialRole);
  const [mode, setMode] = useState<"login" | "register" | "forgot_password">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetSent, setResetSent] = useState(false);
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

  const submitPasswordResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await requestResetFn({ data: { email } });
      if (res.ok) {
        setResetSent(true);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
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
            : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "register"
            ? "Choose your portal and set up a secure account."
            : mode === "forgot_password"
            ? "Enter your account email to receive a password reset code."
            : "Choose the portal you need, then sign in with your credentials."}
        </p>

        {mode !== "forgot_password" && (
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
        {mode !== "forgot_password" && (
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
                  {isSubmitting ? "Generating reset token…" : "Request Password Reset"}
                </Button>
              </form>
            ) : (
              <form onSubmit={submitPasswordResetConfirm} className="space-y-4">
                {successMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{successMsg}</span>
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

        {/* Toggle between Register and Sign In */}
        {mode !== "forgot_password" && (
          <button
            type="button"
            className="mt-5 w-full text-sm font-medium text-muted-foreground underline hover:text-foreground"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
              setSuccessMsg("");
            }}
          >
            {mode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        )}
      </div>
    </div>
  );
}
