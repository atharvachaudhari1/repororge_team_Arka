import { ACCESS_FEATURES, INCLUSION_FEATURES, type Job } from "./jobs-data";
import type { Feedback } from "./app-state";
import { accessTransparency } from "./accessibility";
import { MIN_RESPONSES, employerInsights } from "./insights";

/**
 * Workplace Compass data layer.
 *
 * Answers one question: "Can I confidently access and navigate this workplace?"
 *
 * PRINCIPLES:
 * - Every item carries an honest source label. Missing information is shown as
 *   NOT SPECIFIED — never inferred, never invented on an employer's behalf.
 * - Candidate feedback is aggregated only (never an individual submission) and
 *   only appears once there are enough responses to protect anonymity.
 * - Nothing here is a disability score, a gender score or a candidate ranking,
 *   and none of it uses protected identity.
 */

export type CompassLevel = "verified" | "employer" | "candidate" | "unspecified";

export const COMPASS_LABEL: Record<CompassLevel, string> = {
  verified: "Verified",
  employer: "Employer provided",
  candidate: "Candidate feedback",
  unspecified: "Not specified",
};

export type CompassItem = {
  key: string;
  label: string;
  level: CompassLevel;
  /** Short factual detail for this item, e.g. the work mode or feature labels. */
  detail: string;
};

function levelFor(job: Job, provided: boolean): Exclude<CompassLevel, "candidate"> {
  if (!provided) return "unspecified";
  return job.accessSource === "Verified by AccessPath" ? "verified" : "employer";
}

const ACCESS_KEY_BY_ITEM = {
  interview_accessibility: "accessible_interview",
  application_accessibility: "accessible_application",
  screen_reader: "screen_reader",
  keyboard: "keyboard_friendly",
  captioning: "captioned_meetings",
  flexible_work: "flexible_work",
} as const;

type AccessItemKey = keyof typeof ACCESS_KEY_BY_ITEM;

/** Aggregate candidate ratings by feedback category for one company. */
function feedbackFor(feedback: Feedback[], company: string) {
  const insights = employerInsights(company, feedback);
  const byCategory = new Map<string, { average: number; responses: number; demo: boolean }>();
  if (!insights.enough) return { enough: false as const, byCategory };
  for (const row of insights.rows) {
    byCategory.set(row.key, { average: row.average, responses: row.count, demo: insights.demo });
  }
  return { enough: true as const, byCategory };
}

export function workplaceCompass(job: Job, feedback: Feedback[]): CompassItem[] {
  const rows = accessTransparency(job);
  const levelOf = (key: string) => {
    const row = rows.find((r) => r.key === key);
    return row?.level ?? "unspecified";
  };

  const fb = feedbackFor(feedback, job.company);

  const items: CompassItem[] = [];

  // Work mode is core listing data submitted by the employer.
  items.push({
    key: "work_mode",
    label: "Work Mode",
    level: job.accessSource === "Verified by AccessPath" ? "verified" : "employer",
    detail: `${job.workMode} — ${job.city}, ${job.employment}`,
  });

  // Interview & application accessibility can be confirmed by aggregate
  // candidate feedback when the employer has not stated them.
  const candidateDetail = (
    category: "interview" | "application",
  ): { level: CompassLevel; detail: string } => {
    const accessKey = category === "interview" ? "accessible_interview" : "accessible_application";
    const level = levelOf(accessKey);
    const fbData = fb.enough ? fb.byCategory.get(category) : undefined;
    const fbNote =
      fbData && fbData.responses >= MIN_RESPONSES
        ? ` Candidates rated it ${fbData.average.toFixed(1)} of 5 (${fbData.responses} responses${fbData.demo ? ", demo" : ""}).`
        : "";
    if (level !== "unspecified") {
      return { level, detail: `${ACCESS_FEATURES[accessKey]} — ${COMPASS_LABEL[level]}.${fbNote}` };
    }
    if (fbData && fbData.responses >= MIN_RESPONSES) {
      return {
        level: "candidate",
        detail: `Candidates rated this ${fbData.average.toFixed(1)} of 5 from ${fbData.responses} responses${fbData.demo ? " (demo feedback)" : ""}. The employer has not provided details.`,
      };
    }
    return { level: "unspecified", detail: "Not specified by the employer." };
  };

  const interview = candidateDetail("interview");
  items.push({ key: "interview_accessibility", label: "Interview Accessibility", ...interview });

  const application = candidateDetail("application");
  items.push({
    key: "application_accessibility",
    label: "Application Accessibility",
    ...application,
  });

  const simpleAccessItems: [AccessItemKey, string][] = [
    ["screen_reader", "Screen-reader Support"],
    ["keyboard", "Keyboard Accessibility"],
    ["captioning", "Captioning"],
    ["flexible_work", "Flexible Work"],
  ];
  for (const [itemKey, label] of simpleAccessItems) {
    const accessKey = ACCESS_KEY_BY_ITEM[itemKey];
    const level = levelOf(accessKey);
    items.push({
      key: itemKey,
      label,
      level,
      detail:
        level === "unspecified"
          ? "Not specified by the employer."
          : `${ACCESS_FEATURES[accessKey]} — ${COMPASS_LABEL[level]}`,
    });
  }

  // These three are never invented: AccessPath does not collect them per listing.
  items.push({
    key: "preferred_name_support",
    label: "Preferred Name Support",
    level: "unspecified",
    detail: "Not specified by the employer.",
  });
  items.push({
    key: "pronoun_support",
    label: "Pronoun Support",
    level: "unspecified",
    detail: "Not specified by the employer.",
  });
  items.push({
    key: "accessibility_contact",
    label: "Accessibility Contact",
    level: "unspecified",
    detail: "No contact provided for this role.",
  });

  const inclusionLabels = job.inclusion.map((i) => INCLUSION_FEATURES[i]);
  items.push({
    key: "inclusive_policies",
    label: "Inclusive Policies",
    level: levelFor(job, inclusionLabels.length > 0),
    detail: inclusionLabels.length
      ? `${inclusionLabels.join(", ")} — ${COMPASS_LABEL[levelFor(job, true)]}`
      : "No inclusive policy information provided.",
  });

  return items;
}

export function countCompassGaps(items: CompassItem[]) {
  return items.filter((i) => i.level === "unspecified").length;
}
