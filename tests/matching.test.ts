import { describe, it, expect } from "vitest";
import { normalise, experienceScore, scoreJob, rankJobs } from "@/lib/matching";
import { JOBS, type Job } from "@/lib/jobs-data";
import { DEFAULT_PROFILE } from "@/lib/app-state";

describe("Deterministic Matching Engine", () => {
  it("normalises strings by lowercasing and stripping punctuation while keeping tech symbols", () => {
    expect(normalise("React.js & C++!")).toBe("react js c++");
    expect(normalise("  TypeScript / Node.js   ")).toBe("typescript node js");
  });

  it("calculates experience score accurately based on experience bands", () => {
    // Exact match
    expect(experienceScore("2-5 years", "2-5 years")).toBe(100);
    // Overqualified by 1 band
    expect(experienceScore("5+ years", "2-5 years")).toBe(92);
    // Overqualified by 2+ bands
    expect(experienceScore("5+ years", "Fresher")).toBe(85);
    // Underqualified by 1 band
    expect(experienceScore("Fresher", "0-2 years")).toBe(70);
    // Unknown or unselected band
    expect(experienceScore("unknown", "0-2 years")).toBe(60);
  });

  it("scores job relevance without considering disability or accommodations", () => {
    const job: Job = JOBS[0]!;
    const profileWithAccommodations = {
      ...DEFAULT_PROFILE,
      skills: [...job.requiredSkills],
      experienceBand: job.experience,
      workPreference: job.workMode,
      preferredLocation: job.city,
      accessibilityPreferences: ["screen_reader" as const, "quiet_space" as const],
    };

    const profileWithoutAccommodations = {
      ...DEFAULT_PROFILE,
      skills: [...job.requiredSkills],
      experienceBand: job.experience,
      workPreference: job.workMode,
      preferredLocation: job.city,
      accessibilityPreferences: [],
    };

    const matchWith = scoreJob(profileWithAccommodations, job);
    const matchWithout = scoreJob(profileWithoutAccommodations, job);

    // Disability/accommodation preferences MUST NEVER alter the match score
    expect(matchWith.total).toBe(matchWithout.total);
    expect(matchWith.skills).toBe(matchWithout.skills);
    expect(matchWith.experience).toBe(matchWithout.experience);
    expect(matchWith.career).toBe(matchWithout.career);
    expect(matchWith.workPreference).toBe(matchWithout.workPreference);
    expect(matchWith.total).toBeGreaterThanOrEqual(80);
  });

  it("strictly maintains 100% score invariance across all disability categories", () => {
    const job: Job = JOBS[0]!;
    const baselineProfile = {
      ...DEFAULT_PROFILE,
      skills: [...job.requiredSkills],
      experienceBand: job.experience,
      workPreference: job.workMode,
      preferredLocation: job.city,
      accessibilityPreferences: [],
    };
    const baselineMatch = scoreJob(baselineProfile, job);

    // Test different disability preference profiles
    const testCases = [
      { name: "Vision", prefs: ["screen_reader", "accessible_application", "assistive_tech"] },
      { name: "Hearing", prefs: ["sign_interpreter", "captions_first", "text_communication"] },
      {
        name: "Mobility",
        prefs: ["step_free_access", "accessible_washrooms", "accessible_transport"],
      },
      {
        name: "Neurodivergent",
        prefs: [
          "plain_language",
          "quiet_workspace",
          "written_instructions",
          "extended_time_assessments",
        ],
      },
      {
        name: "Chronic / Invisible",
        prefs: ["flexible_hours", "remote_days", "rest_breaks", "leave_flexibility"],
      },
      {
        name: "Combined Multi-Disability",
        prefs: [
          "screen_reader",
          "sign_interpreter",
          "step_free_access",
          "quiet_workspace",
          "flexible_hours",
          "rest_breaks",
        ],
      },
    ];

    for (const tc of testCases) {
      const profile = {
        ...baselineProfile,
        accessibilityPreferences: tc.prefs,
      };
      const match = scoreJob(profile, job);
      expect(match.total, `${tc.name} should not change total score`).toBe(baselineMatch.total);
      expect(match.skills, `${tc.name} should not change skills score`).toBe(baselineMatch.skills);
      expect(match.experience, `${tc.name} should not change experience score`).toBe(
        baselineMatch.experience,
      );
      expect(match.career, `${tc.name} should not change career score`).toBe(baselineMatch.career);
      expect(match.workPreference, `${tc.name} should not change work preference score`).toBe(
        baselineMatch.workPreference,
      );
    }
  });

  it("produces identical job rankings regardless of candidate disability preferences", () => {
    const baselineProfile = {
      ...DEFAULT_PROFILE,
      skills: ["React", "TypeScript", "Node.js"],
      accessibilityPreferences: [],
    };
    const profileWithAllPrefs = {
      ...baselineProfile,
      accessibilityPreferences: [
        "screen_reader",
        "sign_interpreter",
        "step_free_access",
        "quiet_workspace",
        "flexible_hours",
        "remote_days",
        "captions_first",
      ],
    };
    const baselineRanked = rankJobs(baselineProfile, JOBS);
    const prefsRanked = rankJobs(profileWithAllPrefs, JOBS);

    expect(baselineRanked.length).toBe(prefsRanked.length);
    for (let i = 0; i < baselineRanked.length; i++) {
      expect(prefsRanked[i]!.job.id).toBe(baselineRanked[i]!.job.id);
      expect(prefsRanked[i]!.total).toBe(baselineRanked[i]!.total);
    }
  });

  it("identifies matching and missing required skills correctly", () => {
    const job: Job = JOBS[0]!;
    const candidateSkills = [job.requiredSkills[0]!];
    const profile = {
      ...DEFAULT_PROFILE,
      skills: candidateSkills,
    };

    const result = scoreJob(profile, job);
    expect(result.matchedRequired).toContain(job.requiredSkills[0]);
    if (job.requiredSkills.length > 1) {
      expect(result.missingRequired).toContain(job.requiredSkills[1]);
    }
  });
});

describe("Accessibility Taxonomy, Canonicalization & Fit", () => {
  it("normalises legacy prefixed strings to canonical access feature keys", async () => {
    const { normalisePrefs } = await import("@/lib/accessibility");

    const input = [
      "neuro_quiet_workspace",
      "neuro_written_instructions",
      "neuro_extended_time",
      "health_flexible_hours",
      "health_rest_breaks",
      "health_medical_leave",
      "health_wfh_flares",
      "sign language interpreter",
      "captions for meetings",
      "step-free access",
    ];

    const result = normalisePrefs(input);
    expect(result).toContain("quiet_workspace");
    expect(result).toContain("written_instructions");
    expect(result).toContain("extended_time_assessments");
    expect(result).toContain("flexible_hours");
    expect(result).toContain("rest_breaks");
    expect(result).toContain("leave_flexibility");
    expect(result).toContain("remote_days");
    expect(result).toContain("sign_interpreter");
    expect(result).toContain("captioned_meetings");
    expect(result).toContain("step_free_access");
  });

  it("calculates accessibility fit percentage accurately based on employer stated features", async () => {
    const { accessibilityFit } = await import("@/lib/accessibility");
    const job: Job = {
      ...JOBS[0]!,
      access: ["step_free_access", "screen_reader", "flexible_hours"],
    };

    // Candidate wants 2 features, job has both
    const perfectFit = accessibilityFit(["step_free_access", "flexible_hours"], job);
    expect(perfectFit.score).toBe(100);
    expect(perfectFit.availableCount).toBe(2);
    expect(perfectFit.missing.length).toBe(0);

    // Candidate wants 3 features, job has 1
    const partialFit = accessibilityFit(["screen_reader", "captions_first", "plain_language"], job);
    expect(partialFit.score).toBe(33);
    expect(partialFit.availableCount).toBe(1);
    expect(partialFit.missing.length).toBe(2);

    // Candidate has no preferences
    const emptyFit = accessibilityFit([], job);
    expect(emptyFit.score).toBe(0);
    expect(emptyFit.hasPreferences).toBe(false);
  });
});
