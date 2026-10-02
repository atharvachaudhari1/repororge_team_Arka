import { Link } from "@tanstack/react-router";
import { Sparkles, HeartHandshake, Accessibility } from "lucide-react";
import { AccessibilityToolbar } from "./accessibility-toolbar";
import { useAppState } from "@/lib/app-state";

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

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand"
      >
        Skip to main content
      </a>
      <AccessibilityToolbar />
      <header className="border-b border-border/50 bg-background/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3 group" aria-label="Ableo home: Where Ability Meets Opportunity">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-cyan-500/40">
              <HeartHandshake aria-hidden="true" className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Ableo
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 shadow-sm shadow-cyan-500/10">
                  <Sparkles className="size-2.5 text-cyan-400" /> Team Arka!
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground hidden sm:block">
                The Disability-First Job Platform
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <nav aria-label="Main navigation">
              <ul className="flex flex-wrap items-center gap-1 text-sm">
                {NAV.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/70 hover:text-foreground"
                      activeOptions={{ exact: item.to === "/" }}
                      activeProps={{ className: "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-sm" }}
                    >
                      {item.label}
                      {item.to === "/saved" && savedJobs.length > 0 ? (
                        <span className="ml-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-0.2 text-[11px] text-cyan-400 font-bold">
                          {savedJobs.length}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden lg:flex size-9 items-center justify-center rounded-xl border border-border/60 bg-secondary/40 text-foreground transition-all hover:bg-secondary hover:border-brand/40 hover:scale-105"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="size-4 text-cyan-500 transition-transform duration-300 -rotate-12 hover:rotate-0" />
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
              <span className="text-xs text-muted-foreground">— The Disability-First Job Platform</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Built for People with Disabilities (PwD). XIE – CSI Student Chapter • Repo Forge • 
              Team Arka! (Atharva Chaudhari, Allan Fernandes, Saanvi Chamoli, Bhakti Nimaj).
              Problem Statement #3: Accessible Job Application Assistant.
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
          Ableo is designed for blind users, Deaf users, wheelchair users, neurodivergent people, and anyone with a disability.
          Accommodation details are employer-provided or verified. We never infer disability, never add accommodation claims 
          without consent, and all disability information stays private by default.
        </p>
      </div>
    </footer>
  );
}
