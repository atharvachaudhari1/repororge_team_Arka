import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Job } from "@/./lib/jobs-data";
import type { Profile } from "@/./lib/app-state";
import { accessibilityFit, accessTransparency } from "@/./lib/accessibility";
import { scoreJob } from "@/./lib/matching";

type CheckItem = { label: string; done: boolean };

/**
 * "Your Application Readiness" — a single unified card that tells the
 * candidate whether they have enough information to make a confident
 * decision.  It does NOT block the candidate from applying.
 *
 * PRINCIPLES:
 * - Uses ONLY profile data, job data and accessibility transparency.
 * - Never evaluates identity, disability or employability.
 * - "Not ready" ≠ "don't apply"; it means "information is still missing".
 */
export function ConfidenceCheck({ job, profile }: { job: Job; profile: Profile }) {
  const checks = useMemo<CheckItem[]>(() => {
    const match = scoreJob(profile, job);
    const fit = accessibilityFit(profile.accessibilityPreferences, job);
    const rows = accessTransparency(job);
    const unspecified = rows.filter((r) => r.level === "unspecified");

    return [
      {
        label: "Job requirements understood",
        done: match.matchedRequired.length > 0 || match.total >= 40,
      },
      {
        label: "Skills matched",
        done: match.matchedRequired.length > 0,
      },
      {
        label: "Resume reviewed",
        done: Boolean(profile.resumeName || profile.resumeText),
      },
      {
        label: "Accessibility information checked",
        done: fit.hasPreferences,
      },
      {
        label: "Missing information identified",
        done: unspecified.length === 0,
      },
      {
        label: "Questions prepared",
        done: unspecified.length === 0,
      },
    ];
  }, [job, profile]);

  const completed = checks.filter((c) => c.done).length;
  const total = checks.length;
  const percentage = Math.round((completed / total) * 100);
  const isReady = completed >= total - 1; // allow one missing
  const unspecified = accessTransparency(job).filter((r) => r.level === "unspecified");

  return (
    <section aria-labelledby="confidence-heading" className="surface-card p-5">
      <h2 id="confidence-heading" className="flex items-center gap-2 text-xl font-semibold">
        <ClipboardList aria-hidden="true" className="size-5 text-brand" />
        Your Application Readiness
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <Progress
          value={percentage}
          className="flex-1"
          aria-label={`Application readiness ${percentage} percent`}
        />
        <span className="text-sm font-semibold tabular-nums">
          {completed}/{total}
        </span>
      </div>

      <ul className="mt-4 space-y-2" role="list">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            {c.done ? (
              <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-success" />
            ) : (
              <Circle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>

      {isReady ? (
        <div className="mt-5 rounded-lg border border-success/30 bg-success/5 p-4">
          <h3 className="text-sm font-semibold text-success">Ready to Apply</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You have enough information to make an informed decision.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-warning">
            <AlertTriangle aria-hidden="true" className="size-4" />
            Information Still Missing
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Some workplace accessibility information has not been provided.
            {unspecified.length > 0
              ? ` ${unspecified.length} item${unspecified.length === 1 ? "" : "s"} still unspecified.`
              : ""}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isReady ? (
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
              Review Before Applying
              <ArrowRight aria-hidden="true" className="ml-1 size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild className="min-h-11">
            <Link to="/apply/$jobId" params={{ jobId: job.id }}>
              Apply with Confidence
              <ArrowRight aria-hidden="true" className="ml-1 size-4" />
            </Link>
          </Button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        This readiness check is based on the information in your profile and this listing. It does
        not evaluate your qualifications and never affects your match score.
      </p>
    </section>
  );
}
