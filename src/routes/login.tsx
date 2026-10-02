import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import type { AccountRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === "employer" ? "employer" as const : "candidate" as const,
    redirect: isSafeReturnTo(search.redirect) ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function isSafeReturnTo(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login");
}

function LoginPage() {
  const { role: initialRole, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [role, setRole] = useState<AccountRole>(initialRole);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = isRegistering
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

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-8">
        <h1 className="font-serif text-3xl text-foreground">{isRegistering ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose the portal you need, then {isRegistering ? "create a local account" : "sign in"}.</p>

        <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="Choose a portal">
          {(["candidate", "employer"] as const).map((item) => {
            const active = role === item;
            const Icon = item === "candidate" ? UserRound : Building2;
            return <button key={item} type="button" onClick={() => setRole(item)} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${active ? "border-foreground bg-[#7BD3C2] text-[#141817]" : "border-border bg-background text-muted-foreground hover:bg-secondary"}`} aria-pressed={active}>
              <Icon className="size-4" aria-hidden="true" />{item === "candidate" ? "User portal" : "Employer portal"}
            </button>;
          })}
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
          {isRegistering && <div><label htmlFor="full-name" className="text-sm font-medium">Full name</label><Input id="full-name" className="mt-1.5" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>}
          <div><label htmlFor="email" className="text-sm font-medium">Email address</label><Input id="email" className="mt-1.5" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div><label htmlFor="password" className="text-sm font-medium">Password</label><Input id="password" className="mt-1.5" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : isRegistering ? `Create ${role} account` : `Sign in as ${role === "candidate" ? "user" : "employer"}`}</Button>
        </form>
        <button type="button" className="mt-5 w-full text-sm font-medium text-muted-foreground underline hover:text-foreground" onClick={() => { setIsRegistering((value) => !value); setError(""); }}>
          {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
