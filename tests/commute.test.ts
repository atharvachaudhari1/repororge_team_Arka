import { describe, it, expect } from "vitest";
import {
  calculateCommuteAccessibility,
  getWorkplaceCommuteData,
  DEFAULT_COMMUTE_PROFILE,
  type CandidateCommuteProfile,
} from "@/lib/commute";
import type { Job } from "@/lib/jobs-data";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-commute-test-1",
    title: "Accessibility Engineer",
    company: "InnoTech India",
    city: "Mumbai",
    workMode: "Hybrid",
    employment: "Full-time",
    experience: "2-5 years",
    category: "Software",
    salary: "₹18,00,000 - ₹24,00,000",
    posted: "2 days ago",
    about: "Located in BKC Bandra Kurla Complex G Block with accessible campus facilities.",
    responsibilities: ["Develop accessible code", "Test screen readers"],
    requiredSkills: ["React", "TypeScript", "WCAG"],
    preferredSkills: ["ARIA", "Mobile a11y"],
    access: ["step_free_access", "accessible_washrooms", "accessible_transport"],
    inclusion: ["equal_opportunity"],
    accessSource: "Verified by AccessPath",
    ...overrides,
  };
}

describe("Enhanced Commute Accessibility Scoring", () => {
  it("awards 100 score and Grade A+ for 100% Remote roles", () => {
    const remoteJob = createMockJob({
      workMode: "Remote",
      city: "Remote (India)",
      about: "100% Work from home role anywhere in India.",
    });

    const result = calculateCommuteAccessibility(remoteJob);

    expect(result.overallScore).toBe(100);
    expect(result.tier).toBe("Highly Accessible");
    expect(result.grade).toBe("A+");
    expect(result.isRemoteRole).toBe(true);
    expect(result.greenFlags[0]).toContain("100% Remote Role");
    expect(result.routeLegs.length).toBe(1);
    expect(result.routeLegs[0]?.mode).toBe("Remote");
  });

  it("calculates high accessibility for well-connected corridors like BKC Mumbai", () => {
    const bkcJob = createMockJob({
      city: "Mumbai",
      about: "Premier office in BKC Bandra Kurla Complex with elevator access.",
    });

    const candidateProfile: CandidateCommuteProfile = {
      ...DEFAULT_COMMUTE_PROFILE,
      homeCity: "Mumbai",
      homeLocality: "Bandra West",
      needsStepFreeTransit: true,
      maxWalkDistanceMeters: 500,
    };

    const result = calculateCommuteAccessibility(bkcJob, candidateProfile);

    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.tier).toMatch(/Highly Accessible|Accessible with Minor Support/);
    expect(result.workplace.nearestMetro?.name).toContain("Bandra Kurla");
    expect(result.workplace.nearestMetro?.stepFree).toBe(true);
    expect(result.routeLegs.length).toBe(4);
    expect(result.subScores.transitScore).toBeGreaterThanOrEqual(80);
    expect(result.subScores.workplaceAccessScore).toBeGreaterThanOrEqual(80);
  });

  it("alerts candidate when transit distance exceeds their max walking distance", () => {
    const job = createMockJob({
      city: "Mumbai",
      about: "Office in Powai Hiranandani Business Park.",
    });

    // Metro is 650m away in Powai profile; candidate can only walk 300m
    const lowMobilityCandidate: CandidateCommuteProfile = {
      ...DEFAULT_COMMUTE_PROFILE,
      homeCity: "Mumbai",
      homeLocality: "Ghatkopar",
      needsStepFreeTransit: true,
      maxWalkDistanceMeters: 300,
      needsCompanyCabOrAllowance: true,
    };

    const result = calculateCommuteAccessibility(job, lowMobilityCandidate);

    expect(
      result.warnings.some((w) => w.includes("exceeds your preferred max walking distance")),
    ).toBe(true);
  });

  it("rewards employer cab services and accessible transit allowances", () => {
    const job = createMockJob({
      city: "Gurugram",
      about: "Cyber City DLF Phase 2 office with corporate cab service.",
    });

    const candidate: CandidateCommuteProfile = {
      ...DEFAULT_COMMUTE_PROFILE,
      needsCompanyCabOrAllowance: true,
    };

    const result = calculateCommuteAccessibility(job, candidate);

    expect(result.subScores.assistanceScore).toBeGreaterThanOrEqual(80);
    expect(result.greenFlags.some((f) => f.includes("door-to-door cab"))).toBe(true);
  });

  it("correctly identifies corridor profiles based on job keywords", () => {
    const whitefieldJob = createMockJob({
      city: "Bengaluru",
      about: "Located inside ITPL International Tech Park Whitefield.",
    });
    const data = getWorkplaceCommuteData(whitefieldJob);
    expect(data.corridor).toContain("Whitefield");
    expect(data.nearestMetro?.name).toContain("ITPL");

    const cyberCityJob = createMockJob({
      city: "Gurugram",
      about: "Tower B in DLF Cyber City.",
    });
    const ccData = getWorkplaceCommuteData(cyberCityJob);
    expect(ccData.corridor).toContain("Cyber Hub");
  });
});
