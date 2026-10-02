import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  FileCheck2,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  UserCheck,
  Sparkles,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/job-card";
import { useAppState } from "@/lib/app-state";
import { averageMatch, rankJobs } from "@/lib/matching";
import { NextStepCard } from "@/components/next-step-card";
import { prefLabels } from "@/lib/accessibility";
import { AccessibilitySection } from "@/components/accessibility-toolbar";
import { PortalGate } from "@/components/portal-gate";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ableo" },
      {
        name: "description",
        content: "A disability-first career roadmap for everyone. Where ability meets opportunity.",
      },
    ],
  }),
  component: () => (
    <PortalGate role="candidate">
      <Dashboard />
    </PortalGate>
  ),
});

type FilterCategory = "all" | "remote" | "vision" | "hearing" | "mobility";

function Dashboard() {
  const { savedJobs, applications, profile, profileCompletion, allJobs, findJob } = useAppState();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const rankedAll = useMemo(() => rankJobs(profile, allJobs, 25), [profile, allJobs]);
  const avg = averageMatch(profile, allJobs);

  // Access preferences summary
  const accessPrefs = profile.accessibilityPreferences || [];
  const hasAccessNeeds = accessPrefs.length > 0;
  const configuredNeeds = accessPrefs.filter(
    (p) => !p.startsWith("self_") && !p.startsWith("custom:"),
  );
  const configuredLabels = prefLabels(configuredNeeds);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return rankedAll.filter(({ job }) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.city.toLowerCase().includes(q) ||
          job.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      if (activeFilter === "remote") {
        return job.workMode.toLowerCase().includes("remote");
      }
      if (activeFilter === "vision") {
        return (
          job.access.includes("screen_reader") ||
          job.access.includes("accessible_application") ||
          job.access.includes("keyboard_friendly")
        );
      }
      if (activeFilter === "hearing") {
        return job.access.includes("captioned_meetings") || job.access.includes("assistive_tech");
      }
      if (activeFilter === "mobility") {
        return (
          job.access.includes("accessible_workplace") ||
          job.access.includes("remote_work") ||
          job.access.includes("flexible_work")
        );
      }
      return true;
    });
  }, [rankedAll, activeFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Editorial Ink Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#191716]/15 dark:border-stone-800 bg-[#FAF7F2] dark:bg-[#1C1A18] p-6 sm:p-10 lg:p-12 mb-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Decorative Ink Sketch Elements in Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 select-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Horizon and lake shorelines */}
            <path
              d="M0 240 C 250 240, 350 265, 600 245 C 800 230, 900 250, 1000 245"
              stroke="#191716"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <path
              d="M0 260 C 280 255, 450 285, 700 265 C 880 255, 950 270, 1000 265"
              stroke="#191716"
              strokeWidth="0.8"
            />
            {/* Distant mountain ridges */}
            <path
              d="M120 220 Q 220 180 320 220 T 520 220"
              stroke="#191716"
              strokeWidth="1"
              opacity="0.6"
            />
            <path
              d="M650 215 Q 760 175 870 215 T 1000 215"
              stroke="#191716"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Pine silhouettes left */}
            <path
              d="M40 240 L55 170 L70 240 Z M35 240 L55 190 L75 240 Z"
              fill="#191716"
              opacity="0.85"
            />
            <path d="M80 245 L92 185 L104 245 Z" fill="#191716" opacity="0.75" />
            {/* Pine silhouettes right */}
            <path d="M910 245 L925 175 L940 245 Z" fill="#191716" opacity="0.8" />
            <path d="M945 250 L958 190 L970 250 Z" fill="#191716" opacity="0.7" />
            {/* Hot air balloon in terracotta */}
            <g transform="translate(760, 60)">
              <ellipse
                cx="25"
                cy="30"
                rx="20"
                ry="26"
                fill="#CF4E3D"
                stroke="#191716"
                strokeWidth="1.5"
              />
              <path
                d="M15 45 L35 45 L30 55 L20 55 Z"
                fill="#E5B34C"
                stroke="#191716"
                strokeWidth="1.2"
              />
              <rect x="22" y="58" width="6" height="5" fill="#191716" />
              <path d="M22 55 L22 58 M28 55 L28 58" stroke="#191716" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#191716]/60 bg-white/70 dark:bg-stone-900/70 px-3 py-1 text-xs font-serif italic text-stone-700 dark:text-stone-300 mb-4 backdrop-blur-sm">
            <span>Powered by Ableo</span>
            <span>•</span>
            <span>Disability-Centric Career Mobility</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
            {profile.name ? (
              <>
                A career roadmap for <span className="italic">{profile.name.split(" ")[0]}</span>.
              </>
            ) : (
              <>
                A career roadmap for <span className="italic">everyone</span>.
              </>
            )}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-400 font-sans max-w-lg mx-auto leading-relaxed">
            {profile.headline ||
              "Your career is a journey. Find roles matched to your skills and verified accommodations with confidence."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/jobs"
              search={{ q: "" }}
              className="inline-flex items-center gap-2 rounded-full border border-[#191716] bg-[#7BD3C2] px-6 py-2.5 text-sm font-semibold text-[#141817] shadow-[2px_2px_0px_#141817] transition-all hover:bg-[#6ec2b1] hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore matched roles
              <ArrowRight className="size-4" />
            </Link>

            <Link
              to="/jobs"
              search={{ q: "" }}
              className="inline-flex items-center gap-2 rounded-full border border-[#191716]/80 dark:border-stone-400 bg-white/80 dark:bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-[1px_1px_0px_rgba(0,0,0,0.15)] transition-all hover:bg-stone-50 hover:-translate-y-0.5"
            >
              <MapPin className="size-4 text-[#CF4E3D]" />
              Jobs Map Explorer
            </Link>

            <Link
              to="/career-gps"
              className="inline-flex items-center gap-2 rounded-full border border-[#191716]/80 dark:border-stone-400 bg-white/80 dark:bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-[1px_1px_0px_rgba(0,0,0,0.15)] transition-all hover:bg-stone-50 hover:-translate-y-0.5"
            >
              <Compass className="size-4 text-stone-700 dark:text-stone-300" />
              Career GPS Navigator
            </Link>
          </div>
        </div>

        {/* Vintage Wax Seal / Stamp in Bottom Left */}
        <div className="hidden sm:flex absolute bottom-5 left-6 items-center gap-2 select-none">
          <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#191716] bg-[#E5B34C] text-[#191716] shadow-[2px_2px_0px_#191716] rotate-[-8deg] hover:rotate-0 transition-transform">
            <div className="text-center">
              <span className="block text-[8px] font-bold uppercase tracking-widest leading-none">
                ABLEO
              </span>
              <span className="block text-[11px] font-black tracking-tight leading-none mt-0.5">
                GUIDE
              </span>
            </div>
          </div>
          <div className="text-left text-[11px] text-stone-600 dark:text-stone-400 font-serif italic">
            <p className="font-semibold text-stone-800 dark:text-stone-200">100% Private</p>
            <p>Candidate-disclosed only</p>
          </div>
        </div>
      </section>

      {/* Clean Editorial Stats Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
        <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#191716]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-serif tracking-wider uppercase">Accessibility Match</span>
            <Briefcase className="size-4" />
          </div>
          <p className="mt-2 font-serif text-3xl font-normal text-foreground">{avg}%</p>
          <Link
            to="/jobs"
            search={{ q: "" }}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-foreground"
          >
            Explore {allJobs.length} roles →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#191716]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-serif tracking-wider uppercase">Profile Readiness</span>
            <UserCheck className="size-4" />
          </div>
          <p className="mt-2 font-serif text-3xl font-normal text-foreground">
            {profileCompletion}%
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div className="h-full bg-[#7BD3C2]" style={{ width: `${profileCompletion}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#191716]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-serif tracking-wider uppercase">Active Applications</span>
            <FileCheck2 className="size-4" />
          </div>
          <p className="mt-2 font-serif text-3xl font-normal text-foreground">
            {applications.length}
          </p>
          <Link
            to="/applications"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-foreground"
          >
            Track status →
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#191716]/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-serif tracking-wider uppercase">Bookmarked Roles</span>
            <Bookmark className="size-4" />
          </div>
          <p className="mt-2 font-serif text-3xl font-normal text-foreground">{savedJobs.length}</p>
          <Link
            to="/saved"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-foreground"
          >
            View saved list →
          </Link>
        </div>
      </div>

      {/* Dedicated Accessibility & Adaptive Workspace Section */}
      <AccessibilitySection className="mb-10" />

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Recommended Jobs (8 cols) */}
        <section aria-labelledby="jobs-heading" className="space-y-6 lg:col-span-8">
          <div>
            <NextStepCard
              profile={profile}
              jobs={allJobs}
              applications={applications}
              savedJobs={savedJobs}
            />
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="jobs-heading" className="font-serif text-2xl font-normal text-foreground">
                Recommended Roles
                <span className="ml-2 font-sans text-xs text-stone-500">
                  ({filteredJobs.length} verified listings)
                </span>
              </h2>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search role, skills, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-stone-300 dark:border-stone-700 bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-stone-400 focus:border-[#191716] focus:outline-none"
                />
              </div>
            </div>

            {/* Filter pills matching the reference screenshot */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-4">
              {[
                { id: "all", label: "All Roles" },
                { id: "remote", label: "Remote / WFH" },
                { id: "vision", label: "Vision Support" },
                { id: "hearing", label: "Hearing Support" },
                { id: "mobility", label: "Mobility Support" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveFilter(activeFilter === tab.id ? "all" : (tab.id as FilterCategory))
                  }
                  className={`rounded-full px-4 py-1.5 text-xs transition-all ${
                    activeFilter === tab.id
                      ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                      : "bg-transparent text-stone-600 dark:text-stone-400 hover:text-foreground border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <Link
                to="/jobs"
                search={{ q: "" }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-foreground hover:bg-secondary transition-all"
              >
                <MapPin className="size-3.5 text-[#CF4E3D]" />
                Explore on Map
              </Link>
            </div>
          </div>

          {/* Job Card List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                <p className="font-serif text-lg text-foreground">
                  No roles match your search or filter
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Try clearing your filters to see more recommendations.
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-full border border-[#191716] bg-[#7BD3C2] px-4 py-1.5 text-xs font-semibold text-[#141817] shadow-[1px_1px_0px_#141817]"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredJobs.slice(0, 8).map(({ job }) => <JobCard key={job.id} job={job} />)
            )}
          </div>

          {filteredJobs.length > 8 && (
            <div className="pt-2 text-center">
              <Link
                to="/jobs"
                search={{ q: "" }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#191716] bg-card px-5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-all shadow-[1px_1px_0px_#141817]"
              >
                View all {allJobs.length} listings
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* Right Sidebar: Profile & Companion Tools (4 cols) */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Accommodation Needs Card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-base font-normal text-foreground">
                <Accessibility className="size-4 text-stone-700 dark:text-stone-300" />
                Your Accommodation Needs
              </h2>
              <Link
                to="/profile"
                className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-foreground underline"
              >
                Edit
              </Link>
            </div>

            {hasAccessNeeds ? (
              <div className="mt-3.5 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {configuredLabels.slice(0, 6).map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full border border-[#191716]/20 bg-[#E8F7F4] dark:bg-stone-800 px-3 py-1 text-xs font-medium text-stone-900 dark:text-stone-100"
                    >
                      <CheckCircle2 className="size-3 text-[#3D8B6E]" />
                      {label}
                    </span>
                  ))}
                  {configuredLabels.length > 6 && (
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-stone-600">
                      +{configuredLabels.length - 6} more
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 leading-relaxed font-sans">
                  Used exclusively to calculate your Accessibility Fit score on job postings.
                </p>
              </div>
            ) : (
              <div className="mt-3.5">
                <p className="text-xs text-stone-500">
                  No accommodations configured yet. Add your requirements to see personalized fit
                  scores.
                </p>
                <Link
                  to="/profile"
                  className="mt-3 inline-block rounded-full border border-[#191716] bg-[#7BD3C2] px-4 py-1.5 text-xs font-semibold text-[#141817] shadow-[1px_1px_0px_#141817]"
                >
                  Configure access needs
                </Link>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="size-3.5 shrink-0 text-[#3D8B6E]" />
              <span>100% private — never shared without your permission.</span>
            </div>
          </div>

          {/* Angie / Career Assistant Widget (Matching the reference screenshot!) */}
          <div className="rounded-2xl border-2 border-[#191716] dark:border-stone-700 bg-[#FFFDF9] dark:bg-[#201E1C] p-5 shadow-[3px_3px_0px_#191716] relative overflow-hidden">
            <div className="flex items-center gap-3">
              {/* Illustrated ink portrait avatar */}
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full border border-[#191716] bg-[#E8F7F4] text-lg font-serif">
                <span className="font-bold text-[#141817]">An</span>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border border-[#191716] bg-[#7BD3C2]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-serif tracking-widest text-stone-500">
                  Chat with
                </p>
                <h3 className="font-serif text-lg font-normal text-stone-900 dark:text-stone-100">
                  Angie & AI Coach
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
              Have questions about disclosing accommodations or need mock interview practice? Let's
              talk through your strategy.
            </p>

            <div className="mt-4">
              <Link
                to="/career-gps"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-[#191716] bg-[#7BD3C2] py-2 text-xs font-semibold text-[#141817] shadow-[1px_2px_0px_#141817] hover:bg-[#6ec2b1] transition-all"
              >
                <MessageCircle className="size-3.5" />
                Let's Chat!
              </Link>
            </div>
          </div>

          {/* Applications Status Summary */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-normal text-foreground">
                Recent Applications
              </h2>
              <Link
                to="/applications"
                className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-foreground underline"
              >
                View all ({applications.length})
              </Link>
            </div>

            {applications.length === 0 ? (
              <p className="mt-3 text-xs text-stone-500">
                You haven't submitted any applications yet. When you apply, track progress and
                requested accommodations here.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-border">
                {applications.slice(0, 4).map((a) => {
                  const job = findJob(a.jobId);
                  if (!job) return null;
                  return (
                    <div key={a.jobId} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to="/jobs/$jobId"
                            params={{ jobId: job.id }}
                            className="text-xs font-semibold text-foreground hover:underline font-serif"
                          >
                            {job.title}
                          </Link>
                          <p className="text-[11px] text-stone-500">{job.company}</p>
                        </div>
                        <span className="rounded-full border border-stone-300 dark:border-stone-700 bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-foreground">
                          {a.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
