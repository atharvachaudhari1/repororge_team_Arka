import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  Building2,
  CircleDashed,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BeforeYouApply } from "@/components/before-you-apply";
import type { Job } from "@/lib/jobs-data";
import { useAppState } from "@/lib/app-state";
import { scoreJob } from "@/lib/matching";
import { accessibilityFit } from "@/lib/accessibility";
import {
  COMPASS_LABEL,
  countCompassGaps,
  workplaceCompass,
  type CompassLevel,
} from "@/lib/workplace-compass";

function LevelIcon({ level }: { level: CompassLevel }) {
  if (level === "verified")
    return <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />;
  if (level === "employer")
    return <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />;
  if (level === "candidate")
    return <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-highlight" />;
  return <EyeOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}

/**
 * Workplace Compass.
 *
 * Answers "Can I confidently access and navigate this workplace?" using only
 * employer-provided information, AccessPath verification and aggregated
 * candidate feedback. Never infers missing details, never uses protected
 * identity, and never tells the candidate whether to apply — they decide.
 */
export function WorkplaceCompass({ job }: { job: Job }) {
  const { profile, feedback } = useAppState();

  const items = workplaceCompass(job, feedback);
  const fit = accessibilityFit(profile.accessibilityPreferences, job);
  const gaps = countCompassGaps(items);

  const legend: { level: CompassLevel; help: string }[] = [
    { level: "verified", help: "Checked by the AccessPath team." },
    { level: "employer", help: "Stated by the employer." },
    { level: "candidate", help: "Aggregated candidate ratings." },
    { level: "unspecified", help: "Not stated — ask before applying." },
  ];

  return (
    <section aria-labelledby="compass-heading" className="surface-card p-5">
      <h2 id="compass-heading" className="flex items-center gap-2 text-xl font-semibold">
        <Accessibility aria-hidden="true" className="size-5 text-brand" />
        Workplace Compass
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Can you confidently access and navigate this workplace? Every item shows its source — we
        never infer or invent missing information.
      </p>

      {/* Source legend — icon + label so it never relies on colour alone */}
      <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        {legend.map((l) => (
          <div key={l.level} className="rounded-md border border-border bg-secondary/40 p-2">
            <dt className="flex items-center gap-1.5 font-semibold text-foreground">
              <LevelIcon level={l.level} />
              {COMPASS_LABEL[l.level]}
            </dt>
            <dd className="mt-1">{l.help}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 py-3">
            <LevelIcon level={item.level} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="sr-only">{COMPASS_LABEL[item.level]}: </span>
                <span
                  className={item.level === "unspecified" ? "text-muted-foreground" : "font-medium"}
                >
                  {item.label}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {COMPASS_LABEL[item.level]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 flex items-center gap-2 text-base font-semibold">
        <Sparkles aria-hidden="true" className="size-4 text-brand" />
        Your Workplace Compatibility
      </h3>
      {fit.hasPreferences ? (
        <>
          <p className="mt-2 text-3xl font-bold" aria-live="polite">
            {fit.score}%
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              Workplace Compatibility
            </span>
          </p>
          <Progress
            value={fit.score}
            className="mt-2 h-2"
            aria-label={`Workplace compatibility ${fit.score} percent`}
          />

          <ul className="mt-3 space-y-1 text-sm">
            {fit.available.map((row) => (
              <li key={`ok-${row.key}`} className="flex items-start gap-2">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  <span className="sr-only">Available: </span>
                  {row.label}
                </span>
              </li>
            ))}
            {fit.missing.map((row) => (
              <li key={`gap-${row.key}`} className="flex items-start gap-2">
                <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                <span className="text-muted-foreground">
                  <span className="sr-only">Not specified: </span>
                  {row.label} not specified
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{fit.summary}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        This comparison uses your selected preferences and available workplace information. It is
        not an employability score, it never affects your match score, and it never uses protected
        identity.
      </p>

      <DecisionCard
        jobId={job.id}
        careerMatch={scoreJob(profile, job).total}
        compatibilityScore={fit.hasPreferences ? fit.score : null}
        accessSource={job.accessSource}
        missingCount={gaps}
      >
        <BeforeYouApply job={job} profile={profile} triggerLabel="Ask Employer" />
        <Button asChild className="min-h-11">
          <Link to="/apply/$jobId" params={{ jobId: job.id }}>
            Apply With Confidence
          </Link>
        </Button>
      </DecisionCard>
    </section>
  );
}

/**
 * Neutral pre-application summary. The candidate decides what to do next —
 * AccessPath never tells users whether they should apply.
 */
export function DecisionCard({
  jobId,
  careerMatch,
  compatibilityScore,
  accessSource,
  missingCount,
  children,
}: {
  jobId: string;
  careerMatch: number;
  compatibilityScore: number | null;
  accessSource: string;
  missingCount: number;
  /** Action buttons chosen by the candidate: ask the employer, apply, etc. */
  children?: React.ReactNode;
}) {
  return (
    <aside
      aria-labelledby="decide-heading"
      className="mt-6 rounded-lg border border-brand/30 bg-brand-soft p-4"
    >
      <h3 id="decide-heading" className="text-lg font-semibold">
        Before you decide
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="text-xs text-muted-foreground">Career Match</dt>
          <dd className="text-lg font-semibold">{careerMatch}%</dd>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="text-xs text-muted-foreground">Workplace Compatibility</dt>
          <dd className="text-lg font-semibold">
            {compatibilityScore === null ? "Set preferences to see" : `${compatibilityScore}%`}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="text-xs text-muted-foreground">Accessibility Information</dt>
          <dd className="text-lg font-semibold">{accessSource}</dd>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <dt className="text-xs text-muted-foreground">Missing Information</dt>
          <dd className="text-lg font-semibold">
            {missingCount} {missingCount === 1 ? "item" : "items"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
      <p className="mt-3 text-xs text-muted-foreground">
        These numbers describe this listing against your own professional profile. They do not tell
        you whether to apply — that choice is always yours.
      </p>
    </aside>
  );
}
