import { Link, useRouterState } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { AccountRole } from "@/lib/auth.functions";

export function PortalGate({ role, children }: { role: AccountRole; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const returnTo = useRouterState({ select: (state) => state.location.href });

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">Checking your session…</div>;
  if (user?.role === role || user?.isAdmin) return <>{children}</>;

  const portalName = role === "employer" ? "employer" : "candidate";
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <LockKeyhole aria-hidden="true" className="mx-auto size-8 text-brand" />
      <h1 className="mt-4 font-serif text-3xl text-foreground">Sign in to the {portalName} portal</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Sign in or create a profile to continue. We'll bring you straight back here afterwards.
      </p>
      <Link to="/login" search={{ role, redirect: returnTo }} className="mt-6 inline-flex rounded-full border border-foreground bg-[#7BD3C2] px-5 py-2.5 text-sm font-semibold text-[#141817] shadow-[2px_2px_0px_#141817]">
        {role === "employer" ? "Sign in or create an employer profile" : "Sign in or create a profile"}
      </Link>
    </section>
  );
}
