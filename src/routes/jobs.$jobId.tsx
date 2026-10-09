import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  MapPin,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { ACCESS_FEATURES, INCLUSION_FEATURES, getJob, type Job } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { accessibilityFit } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { savedJobs, toggleSavedJob, profile } = useAppState();
  const job = getJob(jobId);

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Job Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested position does not exist or may have expired.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/jobs">Back to All Jobs</Link>
        </Button>
      </div>
    );
  }

  const isSaved = savedJobs.includes(job.id);
  const fit = accessibilityFit(profile?.accessibilityPreferences as any || [], job);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Link to="/jobs">
            <ArrowLeft className="size-3.5" />
            Back to Job Discovery
          </Link>
        </Button>
      </div>

      {/* Hero Header */}
      <div className="surface-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="size-4 text-brand" />
                {job.company}
              </span>
              {(job.transparencyLevel === "verified" || job.accessSource === "Verified by AccessPath") && (
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="size-3 mr-1" />
                  Verified PwD Friendly
                </Badge>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <MapPin className="size-3.5 text-brand" />
                {job.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {job.workMode} • {job.employment}
              </span>
              {job.salary && (
                <span className="font-semibold text-foreground">
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSavedJob(job.id)}
              className="gap-2 text-xs"
            >
              <Bookmark className={`size-3.5 ${isSaved ? "fill-brand text-brand" : ""}`} />
              {isSaved ? "Saved" : "Save Job"}
            </Button>

            <Button asChild size="sm" className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs px-5">
              <Link to={`/apply/${job.id}` as any}>
                Apply Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Accommodation Fit Banner */}
        {fit.fitScore > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand-soft/40 p-4 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="size-4 text-brand" />
              <span>
                <strong>{fit.fitScore}% Accommodation Match</strong> based on your profile accessibility needs.
              </span>
            </div>
            <span className="font-semibold text-brand">
              {fit.matchedFeatures.length} / {profile.accessibilityPreferences.length} Matched
            </span>
          </div>
        )}
      </div>

      {/* Two Column Layout: Description + Accommodations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Details, Skills, Process */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base font-bold">About the Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>{job.description || job.about}</p>
            </CardContent>
          </Card>

          {/* Required & Preferred Skills */}
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base font-bold">Required &amp; Preferred Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Required Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {job.preferredSkills?.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Bonus / Preferred Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column: Workplace Accommodations */}
        <div className="space-y-6">
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                Workplace Accommodations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {job.access.map((accKey) => {
                const featLabel = ACCESS_FEATURES[accKey] || accKey;
                return (
                  <div key={accKey} className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs">
                    <span className="text-base" aria-hidden="true">♿</span>
                    <div>
                      <span className="font-semibold block text-foreground">
                        {featLabel}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Workplace accessibility accommodation supported
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Inclusion & Culture */}
          {job.inclusion?.length > 0 && (
            <Card className="surface-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand" />
                  Inclusion Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {job.inclusion.map((incKey) => {
                  const incLabel = INCLUSION_FEATURES[incKey] || incKey;
                  return (
                    <div key={incKey} className="flex items-center gap-2 text-foreground">
                      <span aria-hidden="true">✨</span>
                      <span>{incLabel}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
