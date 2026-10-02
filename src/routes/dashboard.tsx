import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  Bookmark,
  Brain,
  Briefcase,
  CheckCircle2,
  Compass,
  Ear,
  Eye,
  FileCheck2,
  Hand,
  Heart,
  ShieldCheck,
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
import { normalisePrefs, prefLabels } from "@/lib/accessibility";

export const Route = createFileRoute("/dashboard")(({
  head: () => ({
    meta: [
      { title: "Dashboard — Ableo" },
      {
        name: "description",
        content:
          "Ableo Dashboard: Your disability-centric job search hub. Accessibility fit scores, accommodation tracking, skill gap analysis, and interview practice — all designed for PwD.",
      },
      { property: "og:title", content: "Dashboard — Ableo" },
      { property: "og:description", content: "Where Ability Meets Opportunity. Your personalised disability-first job search dashboard." },
    ],
  }),
  component: Dashboard,
}));

function Stat({
  icon: Icon,
  label,
  value,
  to,
  cta,
  glowColor = "cyan",
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  to: string;
  cta: string;
  glowColor?: "cyan" | "purple" | "emerald" | "amber";
}) {
  const glowMap = {
    cyan: "border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-cyan-500/10",
    purple: "border-purple-500/20 hover:border-purple-500/50 hover:shadow-purple-500/10",
    emerald: "border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    amber: "border-amber-500/20 hover:border-amber-500/50 hover:shadow-amber-500/10",
  };

  const iconColorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className={`glass-card p-5 border transition-all duration-300 hover:-translate-y-0.5 shadow-lg ${glowMap[glowColor]}`}>
      <div className="flex items-center justify-between">
        <span className={`flex size-9 items-center justify-center rounded-xl border ${iconColorMap[glowColor]}`}>
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-full border border-border/40">
          Metric
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1">{value}</p>
      <Link to={to} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function Dashboard() {
  const { savedJobs, applications, profile, profileCompletion, allJobs, findJob } = useAppState();
  const recommended = rankJobs(profile, allJobs, 3);
  const avg = averageMatch(profile, allJobs);
  const hasSignal = recommended.some((r) => r.hasProfileSignal);

  // Disability-centric metrics
  const accessPrefs = profile.accessibilityPreferences || [];
  const hasAccessNeeds = accessPrefs.length > 0;
  const accessNeedsCount = accessPrefs.filter((p) => !p.startsWith("self_") && !p.startsWith("custom:")).length;
  const selfIdEntries = accessPrefs.filter((p) => p.startsWith("self_"));
  const matchingAccessJobs = allJobs.filter((j) => j.access.length > 0).length;
  const dashboardHeadline = profile.headline.length > 160
    ? `${profile.headline.slice(0, 157).trimEnd()}…`
    : profile.headline;

  // Detect which disability categories user has selected
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Dashboard Top Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-purple-950/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 size-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 size-60 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-400 shadow-sm shadow-cyan-500/20">
                <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                Disability-First Career Hub
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">• Powered by Ableo</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground font-display">
              {profile.name ? (
                <>Welcome back, <span className="gradient-text">{profile.name.split(" ")[0]}</span></>
              ) : (
                <>Your <span className="gradient-text">Ableo Dashboard</span></>
              )}
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              {dashboardHeadline || "Where Ability Meets Opportunity. Your disability-first job matching, accommodation fit, and career mobility center."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button asChild size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 border-0">
              <Link to="/jobs">Explore Matched Jobs</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-border/60 hover:bg-secondary/80">
              <Link to="/career-gps">Career GPS</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* My Disability & Access Summary */}
      <section aria-labelledby="access-summary-heading" className="glass-card mt-6 p-6 border-cyan-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500" />
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <ShieldCheck aria-hidden="true" className="size-4" />
              </span>
              <h2 id="access-summary-heading" className="text-lg font-bold text-foreground">
                My Disability & Access Profile
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
              {hasAccessNeeds
                ? `You have ${accessNeedsCount} accommodation needs configured. ${matchingAccessJobs} jobs in our database provide verified disability accommodations matching your criteria.`
                : "Set up your disability and accommodation needs to get transparent, personalized accessibility fit scores across every job listing."}
            </p>
          </div>
          <Badge variant="outline" className="self-start shrink-0 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1.5 text-xs font-semibold py-1 px-2.5">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            100% Private By Default
          </Badge>
        </div>

        {/* Active Disability Categories */}
        {disabilityCategories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {disabilityCategories.map((cat) => (
              <span
                key={cat.label}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm ${cat.bg} ${cat.border}`}
              >
                <cat.icon className={`size-3.5 ${cat.color}`} />
                <span className={cat.color}>{cat.label} Access Active</span>
              </span>
            ))}
          </div>
        ) : null}

        {/* Quick access needs preview */}
        {hasAccessNeeds ? (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {prefLabels(accessPrefs.filter((p) => !p.startsWith("self_") && !p.startsWith("custom:"))).slice(0, 5).map((label) => (
              <Badge key={label} variant="secondary" className="text-xs gap-1.5 font-medium py-1 px-2.5 bg-secondary/70 border border-border/40">
                <CheckCircle2 className="size-3 text-cyan-400" />
                {label}
              </Badge>
            ))}
            {accessNeedsCount > 5 ? (
              <Badge variant="secondary" className="text-xs font-medium py-1 px-2.5 bg-secondary/70 border border-border/40 text-muted-foreground">
                +{accessNeedsCount - 5} more preferences
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center gap-3">
          <Button asChild variant={hasAccessNeeds ? "outline" : "default"} className={`min-h-10 text-xs font-semibold ${!hasAccessNeeds ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 border-0" : "border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400"}`}>
            <Link to="/profile">
              {hasAccessNeeds ? "Edit Accommodation Needs" : "Set Up My Disability & Access Needs"}
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            Zero inferred disability data • Never shared without candidate consent
          </span>
        </div>
      </section>

      {/* Feature 4-Pillar Hub — Disability Focused with Glowing Accent Borders */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/profile" className="glass-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 group border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Pillar 1</span>
            <span className="size-2 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
          </div>
          <h3 className="font-bold text-sm mt-2 text-foreground group-hover:text-cyan-400 transition-colors">Disability Profile</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Set your access needs & upload CV to extract skills. Your disability data stays 100% private.</p>
        </Link>
        <Link to="/jobs" search={{ q: "" }} className="glass-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 group border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">Pillar 2</span>
            <span className="size-2 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
          </div>
          <h3 className="font-bold text-sm mt-2 text-foreground group-hover:text-purple-400 transition-colors">Accessibility Matching</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">See which jobs match your accommodation needs. Transparent scoring with zero guesswork.</p>
        </Link>
        <Link to="/career-gps" className="glass-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 group border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Pillar 3</span>
            <span className="size-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
          </div>
          <h3 className="font-bold text-sm mt-2 text-foreground group-hover:text-emerald-400 transition-colors">Accessible Career Path</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Personalised career roadmap that factors in your specific disability accommodations.</p>
        </Link>
        <Link to="/career-gps" className="glass-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 group border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Pillar 4</span>
            <span className="size-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
          </div>
          <h3 className="font-bold text-sm mt-2 text-foreground group-hover:text-amber-400 transition-colors">Inclusive Interview Prep</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Practice mock interviews with live captions, voice input, and accommodation simulation.</p>
        </Link>
      </div>

      <div className="mt-6">
        <NextStepCard
          profile={profile}
          jobs={allJobs}
          applications={applications}
          savedJobs={savedJobs}
        />
      </div>

      {/* Career GPS Banner */}
      <section
        aria-labelledby="career-gps-heading"
        className="glass-card mt-5 border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/40 to-indigo-950/30 p-6 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 id="career-gps-heading" className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Compass aria-hidden="true" className="size-5 text-cyan-400" />
              Career GPS Navigator
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Discover accessible career paths matched to your unique skills, education, and specific accommodation requirements.
            </p>
          </div>
          <Button asChild className="shrink-0 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 border-0">
            <Link to="/career-gps">Explore My Career Path →</Link>
          </Button>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Briefcase}
          label="Accessibility match"
          value={`${avg}%`}
          to="/jobs"
          cta="Browse accessible jobs"
          glowColor="cyan"
        />
        <Stat
          icon={Bookmark}
          label="Saved jobs"
          value={String(savedJobs.length)}
          to="/saved"
          cta="View saved jobs"
          glowColor="purple"
        />
        <Stat
          icon={FileCheck2}
          label="Applications"
          value={String(applications.length)}
          to="/applications"
          cta="Track applications"
          glowColor="emerald"
        />
        <div className="glass-card p-5 border border-border/50 hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <UserCheck aria-hidden="true" className="size-4.5" />
            </span>
            <span className="text-xs font-bold text-cyan-400">{profileCompletion}%</span>
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile completion</p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground mt-1">{profileCompletion}%</p>
          <Progress
            value={profileCompletion}
            className="mt-3 h-2 bg-secondary"
            aria-label={`Profile ${profileCompletion} percent complete`}
          />
          <Link
            to="/profile"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Update profile →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="rec-heading">
          <h2 id="rec-heading" className="text-2xl font-bold">
            Recommended accessible jobs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSignal
              ? "Matched to your skills, accommodation needs, and work preferences."
              : "Add your disability & access needs for personalised accessibility-fit matches. Showing latest roles for now."}
          </p>
          <ul className="mt-4 grid gap-4">
            {recommended.map(({ job }) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="apps-heading" className="glass-card p-5 border-border/50 shadow-lg">
            <h2 id="apps-heading" className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>Applications</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {applications.length} active
              </span>
            </h2>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No applications yet. Check the accessibility details on a job listing and apply when the accommodations work for you.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {applications.map((a) => {
                  const job = findJob(a.jobId);
                  if (!job) return null;
                  return (
                    <li key={a.jobId} className="text-sm p-3 rounded-xl bg-secondary/30 border border-border/30 hover:border-cyan-500/30 transition-all">
                      <Link
                        to="/jobs/$jobId"
                        params={{ jobId: job.id }}
                        className="font-bold text-foreground hover:text-cyan-400 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {job.company} • applied {a.date}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-semibold text-[11px] py-0.5">
                          {a.status}
                        </Badge>
                        {a.matchScore ? <MatchPill score={a.matchScore} /> : null}
                        {a.accommodations && a.accommodations.length > 0 ? (
                          <Badge variant="outline" className="text-[10px] font-medium gap-1 border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                            <CheckCircle2 className="size-3" />
                            {a.accommodations.length} access requests
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="snapshot-heading" className="glass-card p-5 border-border/50 shadow-lg">
            <h2 id="snapshot-heading" className="text-lg font-bold text-foreground">
              Career Snapshot
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skills</dt>
                <dd className="mt-1 font-medium">{profile.skills.length ? profile.skills.join(" • ") : "Not added yet"}</dd>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experience</dt>
                <dd className="mt-1 font-medium whitespace-pre-line">{profile.experience || "Not added yet"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Mode</dt>
                  <dd className="mt-1 font-medium text-xs">{profile.workPreference || "Not set"}</dd>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</dt>
                  <dd className="mt-1 font-medium text-xs">{profile.preferredLocation || "Not set"}</dd>
                </div>
              </div>
            </dl>
            <Button asChild variant="outline" className="mt-4 w-full border-border/60 hover:border-primary/40 hover:text-primary">
              <Link to="/profile">Edit Profile</Link>
            </Button>
          </section>

          <section aria-labelledby="prefs-heading" className="glass-card p-5 border-border/50 shadow-lg">
            <h2 id="prefs-heading" className="text-lg font-bold text-foreground flex items-center gap-2">
              <Accessibility className="size-4 text-cyan-400" />
              Disability & Access Needs
            </h2>
            {hasAccessNeeds ? (
              <div className="mt-3 space-y-2">
                {disabilityCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {disabilityCategories.map((cat) => (
                      <span key={cat.label} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${cat.bg} ${cat.border} ${cat.color}`}>
                        <cat.icon className="size-3" />
                        {cat.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-bold text-foreground">{accessNeedsCount}</span> accommodation needs configured
                </p>
                <Badge variant="outline" className="text-[11px] font-medium gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 py-0.5">
                  <ShieldCheck className="size-3" />
                  Private — only shared when you apply
                </Badge>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No access needs configured yet. Set them up to see your Accessibility Fit on every job.
              </p>
            )}
            <Button asChild variant="outline" className="mt-4 w-full border-border/60 hover:border-cyan-500/40 hover:text-cyan-400">
              <Link to="/profile">{hasAccessNeeds ? "Edit Access Needs" : "Set Up Access Needs"}</Link>
            </Button>
          </section>

          <p className="text-xs text-muted-foreground text-center">
            {allJobs.length} accessible listings • Verified accommodation transparency
          </p>
        </aside>
      </div>
    </div>
  );
}
