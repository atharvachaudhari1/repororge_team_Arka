import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  Bookmark,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  Ear,
  Eye,
  FileCheck2,
  Filter,
  GraduationCap,
  Hand,
  Heart,
  Layers,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/job-card";
import { useAppState } from "@/lib/app-state";
import { MatchPill } from "@/components/match-insights";
import { averageMatch, rankJobs } from "@/lib/matching";
import { NextStepCard } from "@/components/next-step-card";
import { prefLabels, accessibilityFit } from "@/lib/accessibility";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Dashboard — Ableo" },
      {
        name: "description",
        content:
          "Ableo Pipeline Dashboard: Multi-column workspace organizing your accessibility status, recommended roles, and application progress side-by-side.",
      },
      { property: "og:title", content: "Command Dashboard — Ableo" },
      {
        property: "og:description",
        content: "Where Ability Meets Opportunity. Your disability-first job search pipeline and command center.",
      },
    ],
  }),
  component: Dashboard,
});

type FilterTab = "all" | "high_match" | "remote" | "screen_reader" | "captions";

function Dashboard() {
  const { savedJobs, applications, profile, profileCompletion, allJobs, findJob } = useAppState();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const rankedAll = useMemo(() => rankJobs(profile, allJobs, 20), [profile, allJobs]);
  const avg = averageMatch(profile, allJobs);
  const hasSignal = rankedAll.some((r) => r.hasProfileSignal);

  // Disability-centric metrics & categories
  const accessPrefs = profile.accessibilityPreferences || [];
  const hasAccessNeeds = accessPrefs.length > 0;
  const accessNeedsCount = accessPrefs.filter((p) => !p.startsWith("self_") && !p.startsWith("custom:")).length;
  const matchingAccessJobs = allJobs.filter((j) => j.access.length > 0).length;

  const disabilityCategories: { icon: typeof Eye; label: string; color: string; bg: string; border: string }[] = [];
  if (accessPrefs.some((p) => ["screen_reader", "keyboard_friendly", "accessible_application"].includes(p) || p === "self_visual"))
    disabilityCategories.push({ icon: Eye, label: "Visual", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" });
  if (accessPrefs.some((p) => ["captioned_meetings", "assistive_tech"].includes(p) || p === "self_deaf"))
    disabilityCategories.push({ icon: Ear, label: "Hearing", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" });
  if (accessPrefs.some((p) => ["remote_work", "flexible_work", "accessible_workplace", "accessible_interview"].includes(p) || p === "self_motor"))
    disabilityCategories.push({ icon: Hand, label: "Motor", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" });
  if (accessPrefs.some((p) => p.startsWith("neuro_") || p === "self_cognitive" || p === "self_neurodivergent"))
    disabilityCategories.push({ icon: Brain, label: "Cognitive", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" });
  if (accessPrefs.some((p) => p.startsWith("health_") || p === "self_chronic" || p === "self_mental_health"))
    disabilityCategories.push({ icon: Heart, label: "Health", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" });

  // Filtered job results for Column 2
  const filteredJobs = useMemo(() => {
    return rankedAll.filter(({ job, total }) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.tags.some((t) => t.toLowerCase().includes(q)) ||
          job.access.some((a) => a.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Tab filter
      if (activeTab === "high_match") return total >= 80;
      if (activeTab === "remote") return job.remote || job.location.toLowerCase().includes("remote");
      if (activeTab === "screen_reader") {
        return (
          job.access.includes("screen_reader") ||
          job.access.includes("accessible_application") ||
          job.access.includes("keyboard_friendly")
        );
      }
      if (activeTab === "captions") {
        return job.access.includes("captioned_meetings") || job.access.includes("assistive_tech");
      }
      return true;
    });
  }, [rankedAll, activeTab, searchQuery]);

  // Group applications by stage for Column 3 Kanban
  const interviewStageApps = applications.filter(
    (a) => a.status.toLowerCase().includes("interview") || a.status.toLowerCase().includes("shortlist")
  );
  const reviewStageApps = applications.filter(
    (a) => a.status.toLowerCase().includes("review") || a.status.toLowerCase().includes("screen")
  );
  const appliedStageApps = applications.filter(
    (a) =>
      !a.status.toLowerCase().includes("interview") &&
      !a.status.toLowerCase().includes("shortlist") &&
      !a.status.toLowerCase().includes("review") &&
      !a.status.toLowerCase().includes("screen")
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Command Bar & Global Live Status */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-xl sticky top-16 z-30 shadow-sm">
        <div className="mx-auto max-w-[1700px] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Candidate Identity Beacon */}
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-cyan-500/20">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "A"}
                <span
                  className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-400"
                  title="Profile Active"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-foreground">
                    {profile.name ? profile.name : "Welcome to Ableo"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                    <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Live Fit Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-md">
                  {profile.headline || "Accessible career matching & inclusive workplace mobility."}
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar & Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-3 rounded-xl bg-secondary/40 border border-border/40 px-3 py-1.5">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Avg Match</p>
                  <p className="text-sm font-extrabold text-cyan-400">{avg}%</p>
                </div>
                <div className="h-6 w-px bg-border/50" />
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Saved</p>
                  <p className="text-sm font-extrabold text-purple-400">{savedJobs.length}</p>
                </div>
                <div className="h-6 w-px bg-border/50" />
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Applied</p>
                  <p className="text-sm font-extrabold text-emerald-400">{applications.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-md shadow-cyan-500/20 border-0"
                >
                  <Link to="/jobs">
                    <Briefcase className="size-3.5 mr-1.5" />
                    Job Board
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-border/60 hover:bg-secondary/70">
                  <Link to="/career-gps">
                    <Compass className="size-3.5 mr-1.5 text-cyan-400" />
                    Career GPS
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Kanban & Pipeline Layout */}
      <main className="mx-auto max-w-[1700px] px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* COLUMN 1: ACCESS VAULT & CANDIDATE IDENTITY (3 COLS)      */}
          {/* ========================================================= */}
          <aside className="lg:col-span-3 space-y-5">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <ShieldCheck className="size-3.5" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Access & Readiness Vault
                </h2>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold py-0.5">
                Private
              </Badge>
            </div>

            {/* Profile Completion & Readiness Card */}
            <div className="glass-card p-5 border-cyan-500/25 shadow-lg relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate Readiness</p>
                  <p className="text-2xl font-extrabold text-foreground mt-0.5">{profileCompletion}% Complete</p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-sm">
                  {profileCompletion}%
                </div>
              </div>
              <Progress
                value={profileCompletion}
                className="mt-3 h-2 bg-secondary"
                aria-label={`Profile readiness ${profileCompletion} percent`}
              />
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {profileCompletion < 70
                  ? "Add skills & access preferences to boost match accuracy by 40%."
                  : "Profile is fully primed for transparent accessibility matching."}
              </p>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <Link
                  to="/profile"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
                >
                  Edit Profile & Skills
                  <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/resume-match"
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Resume Match
                </Link>
              </div>
            </div>

            {/* Configured Disability & Access Accommodations */}
            <div className="glass-card p-5 border-border/50 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Accessibility className="size-4 text-cyan-400" />
                  Disability Categories
                </h3>
                <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {disabilityCategories.length} Active
                </span>
              </div>

              {disabilityCategories.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {disabilityCategories.map((cat) => (
                    <span
                      key={cat.label}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-sm ${cat.bg} ${cat.border} ${cat.color}`}
                    >
                      <cat.icon className="size-3.5" />
                      {cat.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  No disability category selected yet. Specifying your focus helps filter employers with verified support.
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Accommodation Needs ({accessNeedsCount})
                  </p>
                </div>
                {hasAccessNeeds ? (
                  <div className="flex flex-wrap gap-1">
                    {prefLabels(accessPrefs.filter((p) => !p.startsWith("self_") && !p.startsWith("custom:")))
                      .slice(0, 6)
                      .map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2 rounded-md bg-secondary/80 text-foreground border border-border/40"
                        >
                          <CheckCircle2 className="size-2.5 text-cyan-400" />
                          {label}
                        </span>
                      ))}
                    {accessNeedsCount > 6 ? (
                      <span className="text-[11px] font-medium py-0.5 px-2 rounded-md bg-secondary/50 text-muted-foreground">
                        +{accessNeedsCount - 6} more
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Define assistive tech, captioning, or ergonomic requirements.
                  </p>
                )}

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-3.5 w-full text-xs font-semibold border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
                >
                  <Link to="/profile">
                    {hasAccessNeeds ? "Manage Accommodation Needs" : "Configure Access Needs"}
                  </Link>
                </Button>
              </div>

              {/* Privacy Shield Seal */}
              <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-start gap-2">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 leading-tight">
                  <span className="font-bold">Zero inferred data:</span> Accommodations are candidate-disclosed only and never shared with employers without explicit consent.
                </p>
              </div>
            </div>

            {/* 4-Pillar Hub Quick Navigation */}
            <div className="glass-card p-4 border-border/50 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span>Core Ableo Pillars</span>
                <Layers className="size-3.5 text-muted-foreground" />
              </h3>
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/30 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-cyan-400 transition-colors">Disability Profile</p>
                      <p className="text-[10px] text-muted-foreground">CV skills & private access needs</p>
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/jobs"
                  search={{ q: "" }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/30 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors">Access Matching</p>
                      <p className="text-[10px] text-muted-foreground">100% transparent fit scoring</p>
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/career-gps"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/30 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">Career GPS</p>
                      <p className="text-[10px] text-muted-foreground">Adaptive roadmap for PwD</p>
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/career-gps"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/30 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs">
                      4
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-amber-400 transition-colors">Inclusive Interview</p>
                      <p className="text-[10px] text-muted-foreground">Mock prep with live captions</p>
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* Quick Career Specs */}
            <div className="glass-card p-4 border-border/40 shadow-sm text-xs">
              <h3 className="font-bold text-muted-foreground uppercase tracking-wider text-[11px] mb-2">Candidate Specs</h3>
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>Work Mode</span>
                  <span className="font-semibold text-foreground">{profile.workPreference || "Flexible"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span>Target Location</span>
                  <span className="font-semibold text-foreground">{profile.preferredLocation || "Pan-India"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Verified Jobs in DB</span>
                  <span className="font-semibold text-cyan-400">{allJobs.length} roles</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* COLUMN 2: OPPORTUNITIES & LIVE MATCH PIPELINE (5 COLS)    */}
          {/* ========================================================= */}
          <section className="lg:col-span-5 space-y-5" aria-labelledby="pipeline-heading">
            {/* Column Header & Live Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <Briefcase className="size-3.5" />
                </span>
                <h2 id="pipeline-heading" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Opportunities Pipeline
                </h2>
                <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5">
                  {filteredJobs.length} matched
                </Badge>
              </div>

              {/* Quick Search Input */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter roles or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Priority Next Action Spotlight Card */}
            <div>
              <NextStepCard
                profile={profile}
                jobs={allJobs}
                applications={applications}
                savedJobs={savedJobs}
              />
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "all"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
                }`}
              >
                All Recommendations
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("high_match")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "high_match"
                    ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/25"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
                }`}
              >
                Top Fit (&gt;80%)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("remote")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "remote"
                    ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
                }`}
              >
                Remote Only
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("screen_reader")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "screen_reader"
                    ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/25"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
                }`}
              >
                Screen Reader / Vision
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("captions")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === "captions"
                    ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-600/25"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40"
                }`}
              >
                Captions / Hearing
              </button>
            </div>

            {/* List of Matched Job Cards */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="glass-card p-8 text-center border-dashed border-border/60">
                  <p className="text-sm font-semibold text-foreground">No roles match the selected filter</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try switching filters or clearing your search term to see more opportunities.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => {
                      setActiveTab("all");
                      setSearchQuery("");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                filteredJobs.slice(0, 6).map(({ job }) => (
                  <div key={job.id} className="relative group">
                    <JobCard job={job} />
                  </div>
                ))
              )}
            </div>

            {/* View Full Job Board Banner */}
            <div className="glass-card p-4 border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 to-purple-950/20 text-center">
              <p className="text-xs text-muted-foreground">
                Showing top pipeline matches. {allJobs.length} accessible positions available across India.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-500/20 border-0"
              >
                <Link to="/jobs">
                  Browse All {allJobs.length} Accessible Jobs
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </section>

          {/* ========================================================= */}
          {/* COLUMN 3: APPLICATION & INTERVIEW PIPELINE (4 COLS)       */}
          {/* ========================================================= */}
          <aside className="lg:col-span-4 space-y-5" aria-labelledby="applications-heading">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <FileCheck2 className="size-3.5" />
                </span>
                <h2 id="applications-heading" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Application Journey
                </h2>
              </div>
              <Link
                to="/applications"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                Tracker →
              </Link>
            </div>

            {/* Active Kanban Stages */}
            <div className="space-y-4">
              {/* STAGE 1: Interview & Next Actions */}
              <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                    Interview & Prep Stage
                  </span>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] font-bold py-0.5">
                    {interviewStageApps.length}
                  </Badge>
                </div>

                {interviewStageApps.length > 0 ? (
                  <div className="space-y-2.5 mt-2">
                    {interviewStageApps.map((a) => {
                      const job = findJob(a.jobId);
                      if (!job) return null;
                      return (
                        <div key={a.jobId} className="rounded-xl bg-card/80 border border-amber-500/30 p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                to="/jobs/$jobId"
                                params={{ jobId: job.id }}
                                className="font-bold text-xs text-foreground hover:text-amber-400 transition-colors"
                              >
                                {job.title}
                              </Link>
                              <p className="text-[11px] text-muted-foreground">{job.company}</p>
                            </div>
                            {a.matchScore ? <MatchPill score={a.matchScore} /> : null}
                          </div>
                          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/30">
                            <span className="text-[10px] text-muted-foreground">Status: {a.status}</span>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px] font-semibold border-amber-500/40 hover:bg-amber-500/10 text-amber-300"
                            >
                              <Link to="/career-gps">Practice Mock Interview</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs text-muted-foreground">
                      No interviews scheduled yet.
                    </p>
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="text-xs text-amber-400 font-semibold h-auto p-0 mt-1"
                    >
                      <Link to="/career-gps">Run an AI Mock Practice Interview →</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* STAGE 2: Under Review & In Progress */}
              <div className="glass-card p-4 border-cyan-500/25 bg-cyan-500/5 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-cyan-400" />
                    Review & Screening
                  </span>
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-[10px] font-bold py-0.5">
                    {reviewStageApps.length + appliedStageApps.length}
                  </Badge>
                </div>

                {applications.length > 0 ? (
                  <div className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-1">
                    {[...reviewStageApps, ...appliedStageApps].map((a) => {
                      const job = findJob(a.jobId);
                      if (!job) return null;
                      return (
                        <div
                          key={a.jobId}
                          className="rounded-xl bg-card/80 border border-border/40 p-2.5 text-xs hover:border-cyan-500/30 transition-all"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              to="/jobs/$jobId"
                              params={{ jobId: job.id }}
                              className="font-bold text-foreground hover:text-cyan-400 transition-colors"
                            >
                              {job.title}
                            </Link>
                            <Badge variant="secondary" className="text-[10px] font-semibold py-0">
                              {a.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {job.company} • Applied {a.date}
                          </p>
                          {a.accommodations && a.accommodations.length > 0 ? (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              <span>{a.accommodations.length} accommodations requested</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    Check accommodation details on any role to apply with your custom AccessPath checklist.
                  </p>
                )}
              </div>

              {/* Saved Roles Quick Board */}
              <div className="glass-card p-4 border-purple-500/25 bg-purple-500/5 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Bookmark className="size-3.5" />
                    Bookmarked Roles
                  </span>
                  <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-[10px] font-bold py-0.5">
                    {savedJobs.length}
                  </Badge>
                </div>

                {savedJobs.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {savedJobs.slice(0, 3).map((jobId) => {
                      const job = findJob(jobId);
                      if (!job) return null;
                      return (
                        <div
                          key={job.id}
                          className="rounded-xl bg-card/80 border border-border/40 p-2.5 text-xs flex items-center justify-between hover:border-purple-500/40 transition-all"
                        >
                          <div>
                            <Link
                              to="/jobs/$jobId"
                              params={{ jobId: job.id }}
                              className="font-bold text-foreground hover:text-purple-400 transition-colors block"
                            >
                              {job.title}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">{job.company}</p>
                          </div>
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs font-semibold text-primary">
                            <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                              Apply →
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                    {savedJobs.length > 3 ? (
                      <Link
                        to="/saved"
                        className="block text-center text-xs font-semibold text-purple-400 hover:underline pt-1"
                      >
                        View all {savedJobs.length} saved jobs →
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No bookmarked jobs yet. Tap the bookmark icon on any job card to save.
                  </p>
                )}
              </div>

              {/* Inclusive Mock Interview Coach Spotlight */}
              <div className="glass-card p-5 border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-purple-950/20 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Mic className="size-4" />
                  </span>
                  <h3 className="font-bold text-sm text-foreground">Inclusive Interview Simulator</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Practice behavioural & technical interviews with live speech-to-text captions, adjustable pacing, and disability disclosure coaching.
                </p>
                <div className="mt-3.5 flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 border-0 text-xs"
                  >
                    <Link to="/career-gps">Launch Interview Coach →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
