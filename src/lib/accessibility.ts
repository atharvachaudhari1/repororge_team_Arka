import {
  ACCESS_FEATURES,
  INCLUSION_FEATURES,
  type AccessFeature,
  type InclusionFeature,
  type Job,
} from "./jobs-data";

/**
 * Accessibility Fit + transparency helpers.
 *
 * PRINCIPLE: nothing here is a "disability score". We only compare the
 * accessibility features an employer has stated for a role against the
 * accessibility preferences a candidate has explicitly chosen. Identity,
 * disability and gender are never inputs, and Accessibility Fit never changes
 * the professional match score or any ranking of candidates.
 */

export type TransparencyLevel = "verified" | "employer" | "unspecified";

export const TRANSPARENCY_LABEL: Record<TransparencyLevel, string> = {
  verified: "Verified",
  employer: "Employer provided",
  unspecified: "Not specified",
};

export const TRANSPARENCY_HELP: Record<TransparencyLevel, string> = {
  verified: "Checked by the AccessPath team.",
  employer: "Supplied by the employer, not independently verified.",
  unspecified: "The employer has not provided this information.",
};

export type TransparencyRow = {
  key: string;
  label: string;
  level: TransparencyLevel;
};

/** Candidate-selectable preferences, using the same taxonomy as job listings. */
export const ACCESS_PREFERENCE_OPTIONS: { key: AccessFeature; label: string }[] = (
  Object.entries(ACCESS_FEATURES) as [AccessFeature, string][]
).map(([key, label]) => ({ key, label }));

const LEGACY_PREFS: Record<string, AccessFeature> = {
  "screen reader user": "screen_reader",
  "keyboard-only navigation": "keyboard_friendly",
  "magnification / large text": "screen_reader",
  "captions for meetings": "captioned_meetings",
  "captions-first meetings": "captions_first",
  "sign language interpreter": "sign_interpreter",
  "text-based communication": "text_communication",
  "chat-based interview": "chat_interviews",
  "step-free access": "step_free_access",
  "accessible washrooms": "accessible_washrooms",
  "accessible parking / transport": "accessible_transport",
  "plain language": "plain_language",
  "quiet workspace": "quiet_workspace",
  "written instructions": "written_instructions",
  "extended assessment time": "extended_time_assessments",
  "flexible hours": "flexible_hours",
  "remote days": "remote_days",
  "rest breaks": "rest_breaks",
  "leave flexibility": "leave_flexibility",
  "assistive technology at work": "assistive_tech",
  "flexible or remote working": "flexible_work",
  "accessible interview format": "accessible_interview",
  neuro_quiet_workspace: "quiet_workspace",
  neuro_written_instructions: "written_instructions",
  neuro_extended_time: "extended_time_assessments",
  health_flexible_hours: "flexible_hours",
  health_rest_breaks: "rest_breaks",
  health_medical_leave: "leave_flexibility",
  health_wfh_flares: "remote_days",
};

export function normalisePrefs(list: string[] | undefined = []): AccessFeature[] {
  if (!list || !Array.isArray(list)) return [];
  const keys = Object.keys(ACCESS_FEATURES) as AccessFeature[];
  const out: AccessFeature[] = [];
  for (const raw of list) {
    const direct = keys.find((k) => k === raw);
    const legacy = LEGACY_PREFS[raw.toLowerCase()];
    const byLabel = keys.find((k) => ACCESS_FEATURES[k].toLowerCase() === raw.toLowerCase());
    const key = direct ?? legacy ?? byLabel;
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

export function prefLabels(list: string[]) {
  return normalisePrefs(list).map((k) => ACCESS_FEATURES[k]);
}

function levelFor(job: Job, provided: boolean): TransparencyLevel {
  if (!provided) return "unspecified";
  return job.accessSource === "Verified by AccessPath" ? "verified" : "employer";
}

export function accessTransparency(job: Job): TransparencyRow[] {
  return (Object.entries(ACCESS_FEATURES) as [AccessFeature, string][]).map(([key, label]) => ({
    key,
    label,
    level: levelFor(job, job.access.includes(key)),
  }));
}

export function inclusionTransparency(job: Job): TransparencyRow[] {
  return (Object.entries(INCLUSION_FEATURES) as [InclusionFeature, string][]).map(
    ([key, label]) => ({
      key,
      label,
      level: levelFor(job, job.inclusion.includes(key)),
    }),
  );
}

export function transparencyCounts(job: Job) {
  const rows = [...accessTransparency(job), ...inclusionTransparency(job)];
  return {
    verified: rows.filter((r) => r.level === "verified").length,
    employer: rows.filter((r) => r.level === "employer").length,
    unspecified: rows.filter((r) => r.level === "unspecified").length,
  };
}

export type AccessibilityFit = {
  /** Percentage of the candidate's chosen preferences this role lists. 0 when none chosen. */
  score: number;
  hasPreferences: boolean;
  preferenceCount: number;
  availableCount: number;
  available: TransparencyRow[];
  missing: TransparencyRow[];
  /** Everything the employer states for this role, regardless of preferences. */
  provided: TransparencyRow[];
  summary: string;
};

export function accessibilityFit(preferences: string[], job: Job): AccessibilityFit {
  const prefs = normalisePrefs(preferences);
  const rows = accessTransparency(job);
  const provided = rows.filter((r) => r.level !== "unspecified");
  const available = rows.filter(
    (r) => prefs.includes(r.key as AccessFeature) && r.level !== "unspecified",
  );
  const missing = rows.filter(
    (r) => prefs.includes(r.key as AccessFeature) && r.level === "unspecified",
  );
  const score = prefs.length ? Math.round((available.length / prefs.length) * 100) : 0;
  const summary = prefs.length
    ? `You have ${available.length} of ${prefs.length} preferred accessibility features available for this role.`
    : "Choose your accessibility preferences in your profile to see an Accessibility Fit for every role.";
  return {
    score,
    hasPreferences: prefs.length > 0,
    preferenceCount: prefs.length,
    availableCount: available.length,
    available,
    missing,
    provided,
    summary,
  };
}
