import { describe, it, expect } from "vitest";
import { normalise, experienceScore, scoreJob } from "@/lib/matching";
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
    expect(matchWith.total).toBeGreaterThanOrEqual(80);
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
