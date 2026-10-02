import { Building2, ShieldCheck, CircleDashed } from "lucide-react";
import type { Job } from "@/lib/jobs-data";
import {
  ACCESS_FEATURES, INCLUSION_FEATURES, JOBS,
} from "@/lib/jobs-data";
import {
  TRANSPARENCY_LABEL, accessTransparency, inclusionTransparency, transparencyCounts,
} from "@/lib/accessibility";
import { employerInsights } from "@/lib/insights";
import { useAppState } from "@/lib/app-state";
import { StarsReadOnly } from "./accessibility-feedback";

/**
 * One labelled row on the employer profile. Level text comes from the shared
 * transparency vocabulary so labels stay consistent everywhere.
 */
function LabelledRow({ label, level }: { label: string; level: string }) {
  const known = level === "verified" || level === "employer" || level === "unspecified";
  const Icon =
    level === "unspecified"
      ? CircleDashed
      : ShieldCheck;
  return (
    <li className="flex items-start gap-2 py-1.5">
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${level === "unspecified" ? "text-muted-foreground" : "text-success"}`}
      />
      <span className="text-sm">
        {label}{" "}
        <span className="text-muted-foreground">
          — {known ? TRANSPARENCY_LABEL[level as "verified" | "employer" | "unspecified"] : level}
        </span>
      </span>
    </li>
  );
}

const HIRING: (keyof typeof ACCESS_FEATURES)[] = [
  "accessible_application", "accessible_interview", "keyboard_friendly", "screen_reader",
];
const WORKPLACE: (keyof typeof ACCESS_FEATURES)[] = [
  "remote_work", "flexible_work", "accessible_workplace", "assistive_tech", "captioned_meetings",
];

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      {items.length ? (
        <ul className="mt-1 space-y-1 text-sm">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              {i}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
          <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Not specified by this employer.
        </p>
      )}
    </div>
  );
}

/** Employer view built only from what this employer stated on its listings. */
export function EmployerInclusionCard({ job }: { job: Job }) {
  const listings = JOBS.filter((j) => j.company === job.company);
  const counts = transparencyCounts(job);
  const label = (k: keyof typeof ACCESS_FEATURES) => ACCESS_FEATURES[k];
  const { feedback } = useAppState();
  const insights = employerInsights(job.company, feedback);

  return (
    <section aria-labelledby="employer-heading" className="surface-card p-5">
      <h2 id="employer-heading" className="flex items-center gap-2 text-xl font-semibold">
        <Building2 aria-hidden="true" className="size-5 text-brand" />
        {job.company}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {job.category} • {job.city} • {listings.length || 1} live{" "}
        {listings.length === 1 ? "listing" : "listings"} on AccessPath
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Group title="Hiring accessibility" items={job.access.filter((a) => HIRING.includes(a)).map(label)} />
        <Group title="Workplace" items={job.access.filter((a) => WORKPLACE.includes(a)).map(label)} />
        <Group title="Inclusion information" items={job.inclusion.map((i) => INCLUSION_FEATURES[i])} />
        <div>
          <h4 className="text-sm font-semibold">Transparency</h4>
          <dl className="mt-1 space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Verified</dt>
              <dd className="font-medium">{counts.verified} items</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Employer provided</dt>
              <dd className="font-medium">{counts.employer} items</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Not specified</dt>
              <dd className="font-medium">{counts.unspecified} items</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Accessibility practices &amp; support</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Every item keeps its source label. We never describe an employer as more accessible than
          what they stated or what we verified.
        </p>
        <ul className="mt-2 divide-y divide-border">
          {(() => {
            const access = accessTransparency(job);
            const inclusion = inclusionTransparency(job);
            const levelOfAccess = (key: string) =>
              access.find((r) => r.key === key)?.level ?? "unspecified";
            const levelOfInclusion = (key: string) =>
              inclusion.find((r) => r.key === key)?.level ?? "unspecified";
            const workplaceProvided = job.access.filter((a) => WORKPLACE.includes(a)).length;
            return (
              <>
                <LabelledRow
                  label="Accessibility practices"
                  level={
                    workplaceProvided > 0
                      ? job.accessSource === "Verified by AccessPath" ? "verified" : "employer"
                      : "unspecified"
                  }
                />
                <LabelledRow label="Inclusive hiring" level={levelOfInclusion("inclusive_hiring")} />
                <LabelledRow label="Interview accessibility" level={levelOfAccess("accessible_interview")} />
                <LabelledRow label="Flexible work" level={levelOfAccess("flexible_work")} />
                {/* These three are never invented: AccessPath does not collect them per listing. */}
                <LabelledRow label="Preferred name support" level="unspecified" />
                <LabelledRow label="Pronoun support" level="unspecified" />
                <LabelledRow label="Accessibility contact" level="unspecified" />
              </>
            );
          })()}
        </ul>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-semibold">Accessibility insights</h3>
        {insights.enough ? (
          <>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {insights.rows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd>
                    <StarsReadOnly value={row.average} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              Based on aggregated candidate feedback ({insights.responses} responses).
              {insights.demo ? " Demo feedback." : ""} Individual submissions are never shown.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Not enough candidate feedback yet.</p>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        AccessPath does not describe an employer as inclusive. We only show what the employer stated
        and what our team could verify.
      </p>
    </section>
  );
}
