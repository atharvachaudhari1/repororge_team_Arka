import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { type Job, ACCESS_FEATURES } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { accessibilityFit } from "@/lib/accessibility";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function JobCard({
  job,
  detailed = false,
}: {
  job: Job;
  detailed?: boolean;
}) {
  const { savedJobs, toggleSavedJob, profile } = useAppState();
  const isSaved = savedJobs.includes(job.id);

  // Compute Accessibility Fit against candidate preferences
  const candidatePreferences = profile?.accessibilityPreferences || [];
  const fit = accessibilityFit(candidatePreferences as any, job);

  return (
    <article
      aria-labelledby={`job-title-${job.id}`}
      className="surface-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border p-5 transition-all hover:border-brand/60 hover:shadow-md"
    >
      <div>
        {/* Header: Title, Company, Save Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3.5 text-muted-foreground" />
                {job.company}
              </span>
              {(job.transparencyLevel === "verified" || job.accessSource === "Verified by AccessPath") && (
                <Badge variant="outline" className="h-5 gap-1 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                  Verified PwD-Friendly
                </Badge>
              )}
            </div>

            <h3 id={`job-title-${job.id}`} className="font-display text-lg font-bold text-foreground group-hover:text-brand transition-colors">
              <Link to={`/jobs/${job.id}` as any} className="focus-visible:outline-none focus-visible:underline">
                {job.title}
              </Link>
            </h3>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSavedJob(job.id)}
            aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title} for later`}
            className="size-9 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Bookmark className={`size-4 ${isSaved ? "fill-brand text-brand" : ""}`} />
          </Button>
        </div>

        {/* Location, Work Mode & Salary */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
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

        {/* Summary Description */}
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {/* Accommodation Badges */}
        <div className="mt-4 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
              <Zap className="size-3 text-amber-500" />
              Accommodations ({job.access.length})
            </span>

            {fit.fitScore > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="size-3" />
                {fit.fitScore}% Fit
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.access.slice(0, 4).map((accKey) => {
              const label = ACCESS_FEATURES[accKey as keyof typeof ACCESS_FEATURES] || accKey;
              return (
                <span
                  key={accKey}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-foreground"
                >
                  <span aria-hidden="true">✓</span>
                  <span>{label}</span>
                </span>
              );
            })}
            {job.access.length > 4 && (
              <span className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{job.access.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-border/40">
        <span className="text-[11px] text-muted-foreground">
          Posted {job.posted}
        </span>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link to={`/jobs/${job.id}` as any}>
              View Details
            </Link>
          </Button>

          <Button asChild size="sm" className="h-8 text-xs bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold">
            <Link to={`/apply/${job.id}` as any}>
              Apply Now
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
