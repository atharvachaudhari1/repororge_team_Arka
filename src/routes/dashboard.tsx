import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { JOBS } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/job-card";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, savedJobs } = useAppState();

  const savedList = JOBS.filter((j) => savedJobs.includes(j.id));
  const recommendedJobs = JOBS.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Header */}
      <div className="surface-card p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-card via-card to-brand-soft/30 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-brand uppercase tracking-wider">Candidate Portal</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
              Welcome back, {profile.displayName || "Alex"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {profile.headline || "Accessible Frontend & Accessibility Engineer"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild size="sm" className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs">
              <Link to="/jobs">Explore Jobs</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/profile">Edit Profile</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Saved Jobs</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {savedJobs.length}
              <Bookmark className="size-5 text-brand" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Applications Submitted</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              2
              <FileText className="size-5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Matched Accommodations</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {profile.accessibilityPreferences.length}
              <Sparkles className="size-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Verified Inclusive Roles</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {JOBS.length}
              <CheckCircle2 className="size-5 text-blue-500" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recommended Inclusive Opportunities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-brand" />
            Recommended For Your Accommodations
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs text-brand hover:underline">
            <Link to="/jobs">View All Roles</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* Saved Jobs Section */}
      {savedList.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/60">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Bookmark className="size-4 text-brand" />
            Your Saved Positions ({savedList.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedList.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
