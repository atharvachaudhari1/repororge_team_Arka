import { Link } from "@tanstack/react-router";
import { Sun, Moon, Accessibility, Building2 } from "lucide-react";
import { AccessibilitySheetTrigger } from "./accessibility-toolbar";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Jobs" },
  { to: "/career-gps", label: "Career GPS" },
  { to: "/saved", label: "Saved jobs" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/applications", label: "My applications" },
  { to: "/resume-match", label: "Resume match" },
  { to: "/privacy", label: "My privacy" },
  { to: "/employer", label: "For employers" },
  { to: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const { savedJobs, theme, toggleTheme } = useAppState();
  const { user, isLoading, logout } = useAuth();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand"
      >
        Skip to main content
      </a>
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="Ableo home: Where Ability Meets Opportunity"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-foreground/80 bg-foreground text-background text-sm font-serif font-bold transition-transform group-hover:scale-105">
              Ab
            </span>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-foreground">
                Ableo
              </span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2 font-sans">
                Disability-First Career
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            <nav aria-label="Main navigation">
              <ul className="hidden md:flex items-center gap-1 text-sm font-medium">
                {NAV.slice(0, 6).map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="rounded-full px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
                      activeOptions={{ exact: item.to === "/" }}
                      activeProps={{ className: "text-foreground font-semibold bg-secondary" }}
                    >
                      {item.label}
                      {item.to === "/saved" && savedJobs.length > 0 ? (
                        <span className="ml-1 rounded-full bg-foreground text-background px-1.5 py-0.2 text-[10px] font-bold">
                          {savedJobs.length}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <AccessibilitySheetTrigger />

            <Link
              to="/jobs"
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/90 bg-[#7BD3C2] px-4 py-1.5 text-xs font-semibold text-[#141817] shadow-[1px_2px_0px_#141817] transition-all hover:bg-[#6ec2b1] hover:-translate-y-0.5"
            >
              Browse Roles →
            </Link>

            <Link
              to="/employer"
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/90 bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-[1px_2px_0px_rgba(20,24,23,0.35)] transition-all hover:bg-secondary hover:-translate-y-0.5"
            >
              <Building2 className="size-3.5" aria-hidden="true" />
              Post a job
            </Link>

            {!isLoading &&
              (user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Sign in
                </Link>
              ))}

            <Link
              to="/privacy"
              className="flex size-8 items-center justify-center rounded-full border border-foreground/80 bg-[#7BD3C2]/30 text-xs font-bold text-foreground transition-colors hover:bg-[#7BD3C2]"
              title="Accessibility & Privacy Guide"
              aria-label="Accessibility & Privacy Guide"
            >
              ?
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="size-3.5 text-amber-400" />
              ) : (
                <Moon className="size-3.5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Accessibility className="size-4 text-brand" />
              <span className="font-display text-base font-bold text-foreground">Ableo</span>
              <span className="text-xs text-muted-foreground">
                — The Disability-First Job Platform
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Built for People with Disabilities (PwD). XIE – CSI Student Chapter • Repo Forge •
              Team Arka! (Atharva Chaudhari, Allan Fernandes, Saanvi Chamoli, Bhakti Nimaj). Problem
              Statement #3: Accessible Job Application Assistant.
            </p>
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>♿ WCAG 2.2 AA</span>
            <span>🔊 Multi-Modal Accessible</span>
            <span>🔒 Zero Disability Data Inferred</span>
            <span>🧠 Neurodivergent-Friendly</span>
          </div>
        </div>
        <p className="mt-4 border-t border-border/50 pt-4 text-xs">
          Ableo is designed for blind users, Deaf users, wheelchair users, neurodivergent people,
          and anyone with a disability. Accommodation details are employer-provided or verified. We
          never infer disability, never add accommodation claims without consent, and all disability
          information stays private by default.
        </p>
      </div>
    </footer>
  );
}
