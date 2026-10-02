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
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="surface-card p-5">
      <Icon aria-hidden="true" className="size-5 text-brand" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <Link to={to} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
        {cta}
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
  const disabilityCategories: { icon: typeof Eye; label: string; color: string }[] = [];
  if (accessPrefs.some((p) => ["screen_reader", "keyboard_friendly", "accessible_application"].includes(p) || p === "self_visual"))
    disabilityCategories.push({ icon: Eye, label: "Visual", color: "text-blue-600" });
  if (accessPrefs.some((p) => ["captioned_meetings", "assistive_tech"].includes(p) || p === "self_deaf"))
    disabilityCategories.push({ icon: Ear, label: "Hearing", color: "text-purple-600" });
  if (accessPrefs.some((p) => ["remote_work", "flexible_work", "accessible_workplace", "accessible_interview"].includes(p) || p === "self_motor"))
    disabilityCategories.push({ icon: Hand, label: "Motor", color: "text-orange-600" });
  if (accessPrefs.some((p) => p.startsWith("neuro_") || p === "self_cognitive" || p === "self_neurodivergent"))
    disabilityCategories.push({ icon: Brain, label: "Cognitive", color: "text-green-600" });
  if (accessPrefs.some((p) => p.startsWith("health_") || p === "self_chronic" || p === "self_mental_health"))
    disabilityCategories.push({ icon: Heart, label: "Health", color: "text-red-500" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Accessibility className="size-7 text-brand" />
            {profile.name ? `Welcome back, ${profile.name.split(" ")[0]}` : "Your Dashboard"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {dashboardHeadline || "Ableo: Where Ability Meets Opportunity. Your disability-first job matching & career hub."}
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-center bg-brand/5 border-brand/30 text-brand gap-1">
          <Accessibility className="size-3" />
          Disability-First Platform
        </Badge>
      </div>

      {/* My Disability & Access Summary */}
      <section aria-labelledby="access-summary-heading" className="surface-card mt-6 p-5 border-brand/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="access-summary-heading" className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck aria-hidden="true" className="size-5 text-brand" />
              My Disability & Access Profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasAccessNeeds
                ? `You have ${accessNeedsCount} accommodation needs configured. ${matchingAccessJobs} jobs in our database provide disability accommodations.`
                : "Set up your disability and accommodation needs to get personalised accessibility fit scores on every job listing."}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 border-success/40 bg-success/5 text-success gap-1 text-xs">
            <ShieldCheck className="size-3" />
            Private
          </Badge>
        </div>

        {/* Active Disability Categories */}
        {disabilityCategories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {disabilityCategories.map((cat) => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium"
              >
                <cat.icon className={`size-3.5 ${cat.color}`} />
                {cat.label} access configured
              </span>
            ))}
          </div>
        ) : null}

        {/* Quick access needs preview */}
        {hasAccessNeeds ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {prefLabels(accessPrefs.filter((p) => !p.startsWith("self_") && !p.startsWith("custom:"))).slice(0, 5).map((label) => (
              <Badge key={label} variant="secondary" className="text-xs gap-1 font-normal">
                <CheckCircle2 className="size-3 text-success" />
                {label}
              </Badge>
            ))}
            {accessNeedsCount > 5 ? (
              <Badge variant="secondary" className="text-xs font-normal">
                +{accessNeedsCount - 5} more
              </Badge>
            ) : null}
          </div>
        ) : null}

        <Button asChild variant={hasAccessNeeds ? "outline" : "default"} className="mt-3 min-h-11">
          <Link to="/profile">
            {hasAccessNeeds ? "Update My Access Needs" : "Set Up My Disability & Access Needs"}
          </Link>
        </Button>
      </section>

      {/* Feature 4-Pillar Hub — Disability Focused */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/profile" className="surface-card p-4 transition-all hover:border-brand hover:shadow-sm group">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Pillar 1</p>
          <h3 className="font-semibold text-sm mt-1 text-foreground group-hover:text-brand">Disability Profile</h3>
          <p className="text-xs text-muted-foreground mt-1">Set your access needs & upload CV to extract skills. Your disability info stays private.</p>
        </Link>
        <Link to="/jobs" search={{ q: "" }} className="surface-card p-4 transition-all hover:border-brand hover:shadow-sm group">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Pillar 2</p>
          <h3 className="font-semibold text-sm mt-1 text-foreground group-hover:text-brand">Accessibility Matching</h3>
          <p className="text-xs text-muted-foreground mt-1">See which jobs match your accommodation needs. Transparent scoring, no guesswork.</p>
        </Link>
        <Link to="/career-gps" className="surface-card p-4 transition-all hover:border-brand hover:shadow-sm group">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Pillar 3</p>
          <h3 className="font-semibold text-sm mt-1 text-foreground group-hover:text-brand">Accessible Career Path</h3>
          <p className="text-xs text-muted-foreground mt-1">Personalised career roadmap that factors in your specific disability needs.</p>
        </Link>
        <Link to="/career-gps" className="surface-card p-4 transition-all hover:border-brand hover:shadow-sm group">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">Pillar 4</p>
          <h3 className="font-semibold text-sm mt-1 text-foreground group-hover:text-brand">Inclusive Interview Prep</h3>
          <p className="text-xs text-muted-foreground mt-1">Practice interviews with captions, voice input, and disability-specific coaching.</p>
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

      <section
        aria-labelledby="career-gps-heading"
        className="surface-card mt-4 border-brand/30 bg-brand-soft p-5"
      >
        <h2 id="career-gps-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Compass aria-hidden="true" className="size-5 text-brand" />
          Career GPS
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover accessible career paths matched to your skills and accommodation needs.
        </p>
        <Button asChild className="mt-3 min-h-11">
          <Link to="/career-gps">Explore My Career Path</Link>
        </Button>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Briefcase}
          label="Accessibility match"
          value={`${avg}%`}
          to="/jobs"
          cta="Browse accessible jobs"
        />
        <Stat
          icon={Bookmark}
          label="Saved jobs"
          value={String(savedJobs.length)}
          to="/saved"
          cta="View saved jobs"
        />
        <Stat
          icon={FileCheck2}
          label="Applications"
          value={String(applications.length)}
          to="/applications"
          cta="Track applications"
        />
        <div className="surface-card p-5">
          <UserCheck aria-hidden="true" className="size-5 text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">Profile completion</p>
          <p className="text-2xl font-semibold">{profileCompletion}%</p>
          <Progress
            value={profileCompletion}
            className="mt-2"
            aria-label={`Profile ${profileCompletion} percent complete`}
          />
          <Link
            to="/profile"
            className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
          >
            Update profile
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
          <section aria-labelledby="apps-heading" className="surface-card p-5">
            <h2 id="apps-heading" className="text-lg font-semibold">
              Applications
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
                    <li key={a.jobId} className="text-sm">
                      <Link
                        to="/jobs/$jobId"
                        params={{ jobId: job.id }}
                        className="font-medium hover:underline"
                      >
                        {job.title}
                      </Link>
                      <p className="text-muted-foreground">
                        {job.company} • applied {a.date}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {a.status}
                        </Badge>
                        {a.matchScore ? <MatchPill score={a.matchScore} /> : null}
                        {a.accommodations && a.accommodations.length > 0 ? (
                          <Badge variant="outline" className="text-xs font-normal gap-1 border-success/40 text-success">
                            <CheckCircle2 className="size-3" />
                            {a.accommodations.length} accommodations requested
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="snapshot-heading" className="surface-card p-5">
            <h2 id="snapshot-heading" className="text-lg font-semibold">
              Career snapshot
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Skills</dt>
                <dd>{profile.skills.length ? profile.skills.join(" • ") : "Not added yet"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Experience</dt>
                <dd className="whitespace-pre-line">{profile.experience || "Not added yet"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred work mode</dt>
                <dd>{profile.workPreference || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preferred location</dt>
                <dd>{profile.preferredLocation || "Not set"}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/profile">Edit profile</Link>
            </Button>
          </section>

          <section aria-labelledby="prefs-heading" className="surface-card p-5">
            <h2 id="prefs-heading" className="text-lg font-semibold flex items-center gap-2">
              <Accessibility className="size-4 text-brand" />
              My disability & access needs
            </h2>
            {hasAccessNeeds ? (
              <div className="mt-2 space-y-2">
                {disabilityCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {disabilityCategories.map((cat) => (
                      <span key={cat.label} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        <cat.icon className={`size-3 ${cat.color}`} />
                        {cat.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {accessNeedsCount} accommodation needs configured
                </p>
                <Badge variant="outline" className="text-xs font-normal gap-1 border-success/40 text-success">
                  <ShieldCheck className="size-3" />
                  Private — only shared when you choose
                </Badge>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No access needs configured yet. Set them up to see your Accessibility Fit on every job.
              </p>
            )}
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to="/profile">{hasAccessNeeds ? "Edit access needs" : "Set up access needs"}</Link>
            </Button>
          </section>

          <p className="text-xs text-muted-foreground">
            {allJobs.length} accessible listings. Every job includes disability accommodation transparency.
          </p>
        </aside>
      </div>
    </div>
  );
}
