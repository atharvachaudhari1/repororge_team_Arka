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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/job-card";
import { useAppState } from "@/lib/app-state";
import { MatchPill } from "@/components/match-insights";
import { averageMatch, rankJobs } from "@/lib/matching";
import { NextStepCard } from "@/components/next-step-card";
import { prefLabels } from "@/lib/accessibility";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ableo" },
      {
        name: "description",
        content: "Personalised career dashboard with accessible job recommendations and application tracking.",
      },
    ],
  }),
  component: Dashboard,
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
  const configuredNeeds = accessPrefs.filter((p) => !p.startsWith("self_") && !p.startsWith("custom:"));
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
        return job.remote || job.workMode.toLowerCase().includes("remote");
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {profile.name ? `Welcome, ${profile.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.headline || "Accessible job matches and application tracking based on your requirements."}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link to="/career-gps">
                <Compass className="mr-1.5 size-4 text-muted-foreground" />
                Career GPS
              </Link>
            </Button>
            <Button asChild size="sm" className="h-9">
              <Link to="/jobs">
                <Briefcase className="mr-1.5 size-4" />
                Browse All Jobs
              </Link>
            </Button>
          </div>
        </div>

        {/* Clean Metrics Row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Average Match</span>
              <Briefcase className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{avg}%</p>
            <Link to="/jobs" className="mt-2 inline-block text-xs font-medium text-muted-foreground hover:text-foreground">
              Explore matches →
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Profile Setup</span>
              <UserCheck className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {profileCompletion}%
            </p>
            <Progress value={profileCompletion} className="mt-3 h-1.5 bg-secondary" />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Applications</span>
              <FileCheck2 className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {applications.length}
            </p>
            <Link to="/applications" className="mt-2 inline-block text-xs font-medium text-muted-foreground hover:text-foreground">
              View tracker →
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">Saved Roles</span>
              <Bookmark className="size-4" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {savedJobs.length}
            </p>
            <Link to="/saved" className="mt-2 inline-block text-xs font-medium text-muted-foreground hover:text-foreground">
              View saved →
            </Link>
          </div>
        </div>
      </header>

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
              <h2 id="jobs-heading" className="text-lg font-bold text-foreground">
                Recommended Roles
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({filteredJobs.length} available)
                </span>
              </h2>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by role, company, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
              {[
                { id: "all", label: "All Roles" },
                { id: "remote", label: "Remote" },
                { id: "vision", label: "Vision Support" },
                { id: "hearing", label: "Hearing Support" },
                { id: "mobility", label: "Mobility Support" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as FilterCategory)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === tab.id
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job Card List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <p className="text-sm font-medium text-foreground">No roles match your search or filter</p>
                <p className="mt-1 text-xs text-muted-foreground">Try clearing your filters to see more recommendations.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              filteredJobs.slice(0, 8).map(({ job }) => (
                <JobCard key={job.id} job={job} />
              ))
            )}
          </div>

          {filteredJobs.length > 8 && (
            <div className="pt-2 text-center">
              <Button asChild variant="outline">
                <Link to="/jobs">
                  View all {allJobs.length} listings
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Right Sidebar: Profile & Companion Tools (4 cols) */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Accessibility Preferences Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Accessibility className="size-4 text-muted-foreground" />
                Your Accommodation Needs
              </h2>
              <Link to="/profile" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Edit
              </Link>
            </div>

            {hasAccessNeeds ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {configuredLabels.slice(0, 6).map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      <CheckCircle2 className="size-3 text-muted-foreground" />
                      {label}
                    </span>
                  ))}
                  {configuredLabels.length > 6 && (
                    <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs text-muted-foreground">
                      +{configuredLabels.length - 6} more
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Used exclusively to calculate your Accessibility Fit score on job postings.
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  No accommodations configured yet. Add your requirements to see personalized fit scores.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full text-xs">
                  <Link to="/profile">Add accommodation preferences</Link>
                </Button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
              <span>Private — never shared without your permission.</span>
            </div>
          </div>

          {/* Applications Status Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Applications</h2>
              <Link to="/applications" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View all ({applications.length})
              </Link>
            </div>

            {applications.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                You haven't submitted any applications yet. When you apply through Ableo, track status and accommodations here.
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
                            className="text-xs font-semibold text-foreground hover:underline"
                          >
                            {job.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">{job.company}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {a.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tools */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Tools & Preparation</h2>
            <div className="mt-3 space-y-2">
              <Link
                to="/career-gps"
                className="flex items-center justify-between rounded-lg border border-border p-3 text-xs font-medium transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">Career GPS</p>
                    <p className="text-[11px] text-muted-foreground">Personalized career pathway roadmap</p>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>

              <Link
                to="/career-gps"
                className="flex items-center justify-between rounded-lg border border-border p-3 text-xs font-medium transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-center gap-2.5">
                  <Mic className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">Interview Coach</p>
                    <p className="text-[11px] text-muted-foreground">Practice with live captions</p>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
