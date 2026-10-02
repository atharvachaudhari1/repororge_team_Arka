import { CircleDashed, ShieldCheck, Building2, Accessibility } from "lucide-react";
import type { Job } from "@/lib/jobs-data";
import {
  TRANSPARENCY_HELP, TRANSPARENCY_LABEL, accessTransparency, accessibilityFit,
  inclusionTransparency, transparencyCounts, type TransparencyRow,
} from "@/lib/accessibility";
import { Progress } from "@/components/ui/progress";

function LevelIcon({ level }: { level: TransparencyRow["level"] }) {
  if (level === "verified") return <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />;
  if (level === "employer") return <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />;
  return <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}

function Rows({ rows }: { rows: TransparencyRow[] }) {
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.key} className="flex items-start gap-2">
          <LevelIcon level={r.level} />
          <span>
            <span className={r.level === "unspecified" ? "text-muted-foreground" : "font-medium"}>{r.label}</span>
            <span className="text-muted-foreground"> — {TRANSPARENCY_LABEL[r.level]}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TransparencyLegend() {
  return (
    <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
      {(["verified", "employer", "unspecified"] as const).map((level) => (
        <div key={level} className="rounded-md border border-border bg-secondary/40 p-2">
          <dt className="flex items-center gap-1.5 font-semibold text-foreground">
            <LevelIcon level={level} />
            {TRANSPARENCY_LABEL[level]}
          </dt>
          <dd className="mt-1">{TRANSPARENCY_HELP[level]}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AccessibilityTransparencyCard({ job }: { job: Job }) {
  const counts = transparencyCounts(job);
  return (
    <section aria-labelledby="transparency-heading" className="surface-card p-5">
      <h2 id="transparency-heading" className="text-xl font-semibold">Accessibility &amp; Inclusion</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Shown exactly as the employer supplied it, or as verified by AccessPath. We never add
        accessibility claims on an employer's behalf.
      </p>
      <TransparencyLegend />
      <p className="mt-3 text-xs text-muted-foreground">
        Verified: {counts.verified} • Employer provided: {counts.employer} • Not specified: {counts.unspecified}
      </p>

      <h3 className="mt-5 text-sm font-semibold">Hiring &amp; workplace accessibility</h3>
      <Rows rows={accessTransparency(job)} />

      <h3 className="mt-5 text-sm font-semibold">Inclusion information</h3>
      <Rows rows={inclusionTransparency(job)} />
    </section>
  );
}

export function AccessibilityFitCard({
  job, preferences,
}: { job: Job; preferences: string[] }) {
  const fit = accessibilityFit(preferences, job);
  return (
    <section aria-labelledby="fit-heading" className="surface-card p-5">
      <h2 id="fit-heading" className="flex items-center gap-2 text-xl font-semibold">
        <Accessibility aria-hidden="true" className="size-5 text-brand" />
        Accessibility Fit
      </h2>
      {fit.hasPreferences ? (
        <>
          <p className="mt-3 text-4xl font-bold">
            {fit.score}%{" "}
            <span className="text-base font-medium text-muted-foreground">Accessibility Fit</span>
          </p>
          <Progress
            value={fit.score}
            className="mt-2"
            aria-label={`Accessibility Fit ${fit.score} percent`}
          />
          <p className="mt-3 text-sm">{fit.summary}</p>

          <h3 className="mt-4 text-sm font-semibold">Your preferences this role provides</h3>
          {fit.available.length ? <Rows rows={fit.available} /> : (
            <p className="mt-2 text-sm text-muted-foreground">None of your preferences are listed for this role.</p>
          )}

          {fit.missing.length ? (
            <>
              <h3 className="mt-4 text-sm font-semibold">Not stated for this role</h3>
              <Rows rows={fit.missing} />
              <p className="mt-2 text-xs text-muted-foreground">
                “Not specified” does not mean unavailable — it means the employer hasn't said. Use
                Before you apply to get a question you can send them.
              </p>
            </>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{fit.summary}</p>
      )}

      <h3 className="mt-5 text-sm font-semibold">This role provides</h3>
      {fit.provided.length ? <Rows rows={fit.provided} /> : (
        <p className="mt-2 text-sm text-muted-foreground">No accessibility information provided.</p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Accessibility Fit compares only the preferences you chose against employer-provided
        information. It is not a disability score, it never affects your professional match score,
        and it is never shared with employers.
      </p>
    </section>
  );
}
