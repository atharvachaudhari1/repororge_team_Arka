import { ACCESS_FEATURES, type Job } from "./jobs-data";
import type { Profile } from "./app-state";
import { accessibilityFit, accessTransparency } from "./accessibility";
import { scoreJob } from "./matching";

/** Everything the "Before you apply" panel needs, computed from real data only. */
export type Briefing = {
  jobTitle: string;
  company: string;
  matched: string[];
  mayNeed: string[];
  workArrangement: string;
  accessibilityProvided: string[];
  interview: string;
  missingInformation: string[];
  matchScore: number;
  accessibilityFitScore: number;
  accessibilityFitSummary: string;
  suggestedQuestion: string;
};

export function buildBriefing(profile: Profile, job: Job): Briefing {
  const match = scoreJob(profile, job);
  const fit = accessibilityFit(profile.accessibilityPreferences, job);
  const rows = accessTransparency(job);
  const unspecified = rows.filter((r) => r.level === "unspecified");

  const missingInformation = unspecified.map((r) => `${r.label}: not provided by the employer.`);

  const interviewKnown = job.access.includes("accessible_interview");
  const interview = interviewKnown
    ? `Accessible interview process offered (${job.accessSource.toLowerCase()}).`
    : "The employer has not described the interview format or its accessibility.";

  const gap = unspecified[0];
  const suggestedQuestion = gap
    ? `Could you confirm whether ${gap.label.toLowerCase()} is available for this role and during the interview process?`
    : "Could you confirm which interview platform you use and that it works with screen readers?";

  return {
    jobTitle: job.title,
    company: job.company,
    matched: match.matchedRequired.concat(match.matchedPreferred),
    mayNeed: match.missingRequired,
    workArrangement: `${job.workMode} • ${job.city} • ${job.employment}`,
    accessibilityProvided: job.access.map((a) => ACCESS_FEATURES[a]),
    interview,
    missingInformation,
    matchScore: match.total,
    accessibilityFitScore: fit.score,
    accessibilityFitSummary: fit.summary,
    suggestedQuestion,
  };
}

/** Compact, privacy-safe prompt payload. No identity, disability or legal name. */
export function briefingPrompt(b: Briefing) {
  return [
    `Role: ${b.jobTitle} at ${b.company}`,
    `Work arrangement: ${b.workArrangement}`,
    `Skills the candidate already matches: ${b.matched.join(", ") || "none recorded"}`,
    `Skills the candidate may need: ${b.mayNeed.join(", ") || "none"}`,
    `Accessibility features the employer states: ${b.accessibilityProvided.join(", ") || "none"}`,
    `Interview information: ${b.interview}`,
    `Accessibility information the employer did NOT provide: ${
      b.missingInformation.join("; ") || "none"
    }`,
    `Professional match score: ${b.matchScore}%. Accessibility Fit: ${b.accessibilityFitScore}%.`,
  ].join("\n");
}

/** Used when AI is unavailable, so the feature never fails. */
export function fallbackAdvice(b: Briefing) {
  const lines = [
    b.matched.length
      ? `You already match ${b.matched.slice(0, 4).join(", ")}, so lead with those in your application.`
      : "Add your skills to your profile so this summary can highlight your strengths.",
  ];
  if (b.mayNeed.length)
    lines.push(
      `Be ready to talk about ${b.mayNeed.slice(0, 3).join(", ")} — the employer lists these as requirements.`,
    );
  if (b.missingInformation.length)
    lines.push(
      `${b.missingInformation.length} accessibility detail${b.missingInformation.length === 1 ? " is" : "s are"} missing from this listing, so ask before the interview stage.`,
    );
  return { advice: lines, question: b.suggestedQuestion, source: "offline" as const };
}

/**
 * Deterministic question bank for accessibility information an employer has
 * NOT provided. Questions only ever ask about the process — they never assume
 * anything about the candidate and never invent employer claims.
 */
const QUESTION_BANK: Record<string, string> = {
  screen_reader: "Does the technical assessment support screen readers?",
  keyboard_friendly: "Can the whole application and assessment be completed using only a keyboard?",
  accessible_application:
    "Is the application portal tested for accessibility, and is there an alternative way to apply?",
  accessible_interview:
    "Can you describe the interview format and any accessibility options available for it?",
  captioned_meetings: "Are captions available during interviews and team meetings?",
  flexible_work: "How flexible are working hours or locations for this role in practice?",
  remote_work: "Is remote or hybrid working possible for this role?",
  assistive_tech: "Does the company provide assistive technology or software on request?",
  accessible_workplace:
    "Is the workplace physically accessible, including entrances and meeting rooms?",
};

/** Always offered when not stated by the employer. */
const ALWAYS_OFFERED = [
  {
    key: "preferred_name_support",
    question: "Can candidates use their preferred name throughout interviews and onboarding?",
  },
];

export function suggestedQuestions(job: Job): string[] {
  const rows = accessTransparency(job);
  const questions: string[] = [];
  for (const row of rows) {
    if (row.level === "unspecified") {
      const q = QUESTION_BANK[row.key];
      if (q) questions.push(q);
    }
  }
  for (const extra of ALWAYS_OFFERED) {
    // Preferred-name support is never collected per listing, so this question
    // is always relevant before applying.
    if (!questions.includes(extra.question)) questions.push(extra.question);
  }
  return questions;
}
