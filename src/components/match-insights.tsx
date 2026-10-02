import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { matchSummary, type MatchResult } from "@/lib/matching";

export function MatchPill({ score, label }: { score: number; label?: string }) {
  const tone =
    score >= 85 ? "bg-success/15 text-success" : score >= 65 ? "bg-brand/15 text-brand" : "bg-secondary text-secondary-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      <Sparkles aria-hidden="true" className="size-3.5" />
      {score}% match{label ? ` — ${label}` : ""}
    </span>
  );
}

const BREAKDOWN: { key: keyof MatchResult; label: string }[] = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "career", label: "Career goal" },
  { key: "workPreference", label: "Work preference" },
];

export function MatchScoreCard({ match }: { match: MatchResult }) {
  const summary = matchSummary(match);
  return (
    <section aria-labelledby="match-heading" className="surface-card p-5">
      <h2 id="match-heading" className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles aria-hidden="true" className="size-5 text-brand" />
        AI match analysis
      </h2>
      <p className="mt-3 text-4xl font-bold" aria-live="polite">
        {match.total}% <span className="text-base font-medium text-muted-foreground">match</span>
      </p>

      <dl className="mt-4 space-y-3">
        {BREAKDOWN.map(({ key, label }) => {
          const value = match[key] as number;
          return (
            <div key={label}>
              <div className="flex items-center justify-between text-sm">
                <dt>{label}</dt>
                <dd className="font-semibold">{value}%</dd>
              </div>
              <Progress value={value} className="mt-1" aria-label={`${label} ${value} percent`} />
            </div>
          );
        })}
      </dl>

      <ul className="mt-4 space-y-1 text-sm">
        {summary.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        Scores use only job-related evidence: skills, experience, education, career interests,
        location and work-mode preference. Disability, assistive-technology use, accommodation
        requests and gender identity never change a score.
      </p>
    </section>
  );
}

export function WhyThisJob({ match }: { match: MatchResult }) {
  const headingId = `why-${match.job.id}`;
  return (
    <section aria-labelledby={headingId} className="surface-card p-5">
      <h2 id={headingId} className="text-xl font-semibold">
        Why this job matches you
      </h2>
      {!match.hasProfileSignal ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Add your skills, experience level and career interests to your profile to see a
          personalised explanation.
        </p>
      ) : null}
      <ul className="mt-3 space-y-2 text-sm">
        {match.reasons.map((r) => (
          <li key={r.text} className="flex items-start gap-2">
            {r.kind === "match" ? (
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            )}
            <span>
              <span className="sr-only">{r.kind === "match" ? "Match: " : "Consider: "}</span>
              {r.text}
            </span>
          </li>
        ))}
      </ul>
      {match.accessibilityFit.length ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Workplace support you asked about is listed by this employer:{" "}
          {match.accessibilityFit.join(", ")}. This is shown for your information only and does not
          affect the score.
        </p>
      ) : null}
    </section>
  );
}
