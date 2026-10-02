import { type Job, type ExperienceBand } from "./jobs-data";
import type { Profile } from "./app-state";
import { accessibilityFit } from "./accessibility";

/**
 * Deterministic, explainable matching engine.
 *
 * FAIRNESS RULE: only job-related evidence (skills, experience, education,
 * career interests, location and work-mode preference) can change a score.
 * Disability, assistive-technology use, accommodation requests and gender
 * identity are NEVER inputs to the score. Accessibility information is used
 * only to describe how well a workplace fits a stated working preference,
 * and is reported separately from the score.
 */

const BANDS: ExperienceBand[] = ["Fresher", "0-2 years", "2-5 years", "5+ years"];

export type MatchReason = { kind: "match" | "gap"; text: string };

export type MatchResult = {
  job: Job;
  total: number;
  skills: number;
  experience: number;
  career: number;
  workPreference: number;
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  requirementsTotal: number;
  requirementsMet: number;
  strongest: string[];
  reasons: MatchReason[];
  accessibilityFit: string[];
  hasProfileSignal: boolean;
};

export function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9+# ]/g, " ").replace(/\s+/g, " ").trim();
}

function skillHit(candidate: string[], skill: string) {
  const s = normalise(skill);
  return candidate.some((c) => c === s || (c.length > 2 && (s.includes(c) || c.includes(s))));
}

function bandIndex(b: string) {
  const i = BANDS.indexOf(b as ExperienceBand);
  return i < 0 ? -1 : i;
}

export function experienceScore(candidateBand: string, jobBand: ExperienceBand) {
  const c = bandIndex(candidateBand);
  const j = bandIndex(jobBand);
  if (c < 0) return 60;
  if (c === j) return 100;
  if (c > j) return c - j >= 2 ? 85 : 92;
  return j - c === 1 ? 70 : 45;
}

/** Tokens describing what the person wants to do next. */
function careerTokens(profile: Profile) {
  return normalise(`${profile.headline} ${profile.careerInterests}`)
    .split(" ")
    .filter((t) => t.length > 3);
}

export function scoreJob(profile: Profile, job: Job): MatchResult {
  const candidateSkills = profile.skills.map(normalise).filter(Boolean);
  const resumeSkills = normalise(profile.resumeText || "");

  const matchedRequired = job.requiredSkills.filter(
    (s) => skillHit(candidateSkills, s) || (resumeSkills ? resumeSkills.includes(normalise(s)) : false),
  );
  const missingRequired = job.requiredSkills.filter((s) => !matchedRequired.includes(s));
  const matchedPreferred = job.preferredSkills.filter(
    (s) => skillHit(candidateSkills, s) || (resumeSkills ? resumeSkills.includes(normalise(s)) : false),
  );

  const reqCount = job.requiredSkills.length || 1;
  const skills = Math.round(
    Math.min(
      100,
      (matchedRequired.length / reqCount) * 90 +
        (matchedPreferred.length / Math.max(job.preferredSkills.length, 1)) * 15,
    ),
  );

  const experience = experienceScore(profile.experienceBand, job.experience);

  const tokens = careerTokens(profile);
  const target = normalise(`${job.title} ${job.category}`);
  const careerHits = tokens.filter((t) => target.includes(t)).length;
  const career = tokens.length === 0 ? 60 : careerHits > 0 ? Math.min(100, 70 + careerHits * 15) : 45;

  const modeMatch =
    !profile.workPreference || profile.workPreference === "No preference"
      ? 80
      : profile.workPreference === job.workMode
        ? 100
        : profile.workPreference === "Hybrid" && job.workMode !== "On-site"
          ? 75
          : 50;
  const loc = profile.preferredLocation.trim().toLowerCase();
  const locMatch = !loc
    ? 80
    : job.city.toLowerCase().includes(loc) || (loc.includes("remote") && job.workMode === "Remote")
      ? 100
      : job.workMode === "Remote"
        ? 90
        : 50;
  const workPreference = Math.round(modeMatch * 0.6 + locMatch * 0.4);

  const eduBonus =
    profile.education.trim() || profile.certifications.trim() ? 3 : 0;

  const total = Math.max(
    0,
    Math.min(
      100,
      Math.round(skills * 0.45 + experience * 0.2 + career * 0.2 + workPreference * 0.15) + eduBonus,
    ),
  );

  const requirementsTotal = job.requiredSkills.length + job.preferredSkills.length;
  const requirementsMet = matchedRequired.length + matchedPreferred.length;

  const reasons: MatchReason[] = [];
  if (workPreference >= 90 && profile.workPreference && profile.workPreference === job.workMode)
    reasons.push({ kind: "match", text: `${job.workMode} work matches your stated preference` });
  if (locMatch === 100 && loc)
    reasons.push({ kind: "match", text: `Location matches your preference (${job.city})` });
  if (matchedRequired.length)
    reasons.push({
      kind: "match",
      text: `Your ${matchedRequired.slice(0, 3).join(", ")} ${matchedRequired.length === 1 ? "skill matches" : "skills match"} the role`,
    });
  if (job.experience === "Fresher") reasons.push({ kind: "match", text: "Fresher-friendly role" });
  else if (experience >= 92)
    reasons.push({ kind: "match", text: `Your experience level fits the ${job.experience} requirement` });
  if (career >= 85)
    reasons.push({ kind: "match", text: `Aligned with your stated career interest in ${job.category.toLowerCase()}` });
  if (job.access.includes("accessible_interview"))
    reasons.push({ kind: "match", text: "Accessible interview process offered by the employer" });
  if (missingRequired.length)
    reasons.push({
      kind: "gap",
      text: `You may need to strengthen ${missingRequired.slice(0, 2).join(" and ")}`,
    });
  if (experience < 70)
    reasons.push({ kind: "gap", text: `Role asks for ${job.experience} experience` });
  if (!profile.skills.length)
    reasons.push({ kind: "gap", text: "Add skills to your profile for a sharper match" });

  const fit = accessibilityFit(profile.accessibilityPreferences, job);

  return {
    job, total, skills, experience, career, workPreference,
    matchedRequired, missingRequired, matchedPreferred,
    requirementsTotal, requirementsMet,
    strongest: matchedRequired.slice(0, 3),
    reasons,
    accessibilityFit: fit.available.map((r) => r.label),
    hasProfileSignal: Boolean(profile.skills.length || profile.headline || profile.careerInterests),
  };
}

export function matchSummary(m: MatchResult) {
  const lines = [
    `You match ${m.requirementsMet} of the ${m.requirementsTotal} major requirements for this role.`,
  ];
  if (m.strongest.length) lines.push(`Your strongest matches are ${m.strongest.join(", ")}.`);
  if (m.missingRequired.length)
    lines.push(`Your main missing skill is ${m.missingRequired[0]}.`);
  else lines.push("You cover every required skill listed by the employer.");
  return lines;
}

export function rankJobs(profile: Profile, jobs: Job[], limit?: number) {
  const ranked = jobs.map((j) => scoreJob(profile, j)).sort((a, b) => b.total - a.total);
  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

export function averageMatch(profile: Profile, jobs: Job[]) {
  const top = rankJobs(profile, jobs, 5);
  if (!top.length) return 0;
  return Math.round(top.reduce((n, m) => n + m.total, 0) / top.length);
}

/** Very light resume text analysis against a chosen job. */
export function analyseResume(resumeText: string, job: Job, profile: Profile) {
  const text = normalise(resumeText);
  const has = (s: string) => text.includes(normalise(s));
  const matched = [...job.requiredSkills, ...job.preferredSkills].filter(has);
  const missingRequired = job.requiredSkills.filter((s) => !has(s));
  const missingPreferred = job.preferredSkills.filter((s) => !has(s));
  const coverage = Math.round(
    (matched.length / Math.max(job.requiredSkills.length + job.preferredSkills.length, 1)) * 100,
  );
  const experience = experienceScore(profile.experienceBand, job.experience);
  const notes = missingRequired.map(
    (s) => `Your resume does not mention ${s}, but the job requires ${s.toLowerCase()}.`,
  );
  const bullets = [
    ...missingRequired.slice(0, 3).map(
      (s) =>
        `Built and shipped work using ${s} — add one measurable outcome, e.g. "Used ${s} to deliver X, reducing Y by Z%".`,
    ),
    ...matched.slice(0, 2).map(
      (s) => `Strengthen your existing ${s} bullet with scale and impact, e.g. "${s}: delivered N features used by M users".`,
    ),
    `Mirror the job's wording for ${job.title} in your summary line so screening tools match it.`,
  ];
  return { coverage, matched, missingRequired, missingPreferred, experience, notes, bullets };
}
