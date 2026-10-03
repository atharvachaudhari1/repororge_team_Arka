import { Link } from "@tanstack/react-router";
import { Sun, Moon, Accessibility, Building2, User, Menu, FileText, Sparkles } from "lucide-react";
import { AccessibilitySheetTrigger } from "./accessibility-toolbar";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/jobs", label: "Jobs" },
  { to: "/profile", label: "Profile" },
  { to: "/resume-match", label: "Resume Match" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/career-gps", label: "Career GPS" },
  { to: "/saved", label: "Saved jobs" },
  { to: "/applications", label: "Applications" },
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
              <ul className="hidden lg:flex items-center gap-1 text-sm font-medium">
                {NAV.map((item) => (
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
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-foreground/80 bg-secondary/80 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:-translate-y-0.5"
              title="Your Profile & Resume"
            >
              <User className="size-3.5 text-brand" aria-hidden="true" />
              <span>{user ? user.fullName.split(" ")[0] : "Profile"}</span>
            </Link>

            <Link
              to="/jobs"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-foreground/90 bg-[#7BD3C2] px-4 py-1.5 text-xs font-semibold text-[#141817] shadow-[1px_2px_0px_#141817] transition-all hover:bg-[#6ec2b1] hover:-translate-y-0.5"
            >
              Browse Roles →
            </Link>

            <Link
              to="/employer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-foreground/90 bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-[1px_2px_0px_rgba(20,24,23,0.35)] transition-all hover:bg-secondary hover:-translate-y-0.5"
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

            {/* Mobile Navigation Drawer */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full border border-border text-foreground hover:bg-secondary"
                    aria-label="Open Navigation Menu"
                  >
                    <Menu className="size-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-5">
                  <SheetHeader className="text-left border-b border-border pb-3">
                    <SheetTitle className="font-serif text-lg font-bold flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background text-xs font-serif font-bold">
                        Ab
                      </span>
                      Ableo Navigation
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-4 flex flex-col gap-1.5" aria-label="Mobile Navigation">
                    <SheetClose asChild>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 rounded-xl border border-brand/40 bg-brand-soft/40 p-2.5 text-sm font-semibold text-foreground hover:bg-brand-soft transition-colors"
                      >
                        <User className="size-4 text-brand" />
                        <div>
                          <span className="block font-medium">Your Profile &amp; Resume</span>
                          <span className="text-[11px] text-muted-foreground">
                            Upload CV, skills, preferences
                          </span>
                        </div>
                      </Link>
                    </SheetClose>
                    {NAV.map((item) => (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          <span>{item.label}</span>
                          {item.to === "/saved" && savedJobs.length > 0 && (
                            <span className="rounded-full bg-foreground text-background px-1.5 py-0.2 text-[10px] font-bold">
                              {savedJobs.length}
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                    ))}
                    <div className="my-2 border-t border-border pt-2 flex flex-col gap-1.5">
                      <SheetClose asChild>
                        <Link
                          to="/employer"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                        >
                          <Building2 className="size-4 text-muted-foreground" />
                          For Employers / Post a job
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/privacy"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                        >
                          <FileText className="size-4 text-muted-foreground" />
                          Accessibility &amp; Privacy Guide
                        </Link>
                      </SheetClose>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
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
            <Link to="/privacy" hash="rights" className="text-brand hover:underline font-medium">
              🇮🇳 India RPwD Rights Guide
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs border-t border-border/50 pt-3 text-muted-foreground">
          <span className="font-semibold text-foreground">Disability Resources & Portals:</span>
          <Link to="/privacy" hash="rights" className="hover:text-foreground underline">
            RPwD Act 2016 Basics
          </Link>
          <a
            href="https://www.swavlambancard.gov.in"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground underline"
          >
            UDID Swavlamban Card
          </a>
          <a
            href="https://ncpedp.org"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground underline"
          >
            NCPEDP (Employment Advocacy)
          </a>
          <a
            href="https://nhfdc.nic.in"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground underline"
          >
            NHFDC (Skill Loans & Aids)
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Ableo is designed for blind users, Deaf users, wheelchair users, neurodivergent people,
          and anyone with a disability. Accommodation details are employer-provided or verified. We
          never infer disability, never add accommodation claims without consent, and all disability
          information stays private by default. Information on legal rights is general and does not
          constitute formal legal advice.
        </p>
      </div>
    </footer>
  );
}
