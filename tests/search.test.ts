import { describe, it, expect } from "vitest";
import { filterJobs, recommendJobs, EMPTY_FILTERS, type Filters } from "../src/lib/search";
import { JOBS, type Job } from "../src/lib/jobs-data";
import { accessibilityFit, normalisePrefs, prefLabels } from "../src/lib/accessibility";
import { DEFAULT_PROFILE } from "../src/lib/app-state";

describe("Search Engine (filterJobs)", () => {
  it("returns all jobs when empty filter is passed", () => {
    const results = filterJobs(EMPTY_FILTERS);
    expect(results.length).toBe(JOBS.length);
  });

  it("filters jobs by keyword query matching title or skills", () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      q: "React",
    };
    const results = filterJobs(filters);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((j) => {
      const matchText = [j.title, j.company, ...j.requiredSkills, ...j.preferredSkills]
        .join(" ")
        .toLowerCase();
      expect(matchText).toContain("react");
    });
  });

  it("filters jobs by work mode (e.g. Remote)", () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      workModes: ["Remote"],
    };
    const results = filterJobs(filters);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((j) => {
      expect(j.workMode).toBe("Remote");
    });
  });

  it("filters jobs by city (e.g. Bengaluru)", () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      cities: ["Bengaluru"],
    };
    const results = filterJobs(filters);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((j) => {
      expect(j.city).toBe("Bengaluru");
    });
  });

  it("filters jobs by required accessibility accommodations (e.g. screen_reader)", () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      access: ["screen_reader"],
    };
    const results = filterJobs(filters);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((j) => {
      expect(j.access).toContain("screen_reader");
    });
  });

  it("combines multiple filters correctly (city + work mode + access)", () => {
    const filters: Filters = {
      ...EMPTY_FILTERS,
      workModes: ["Remote"],
      access: ["flexible_hours"],
    };
    const results = filterJobs(filters);
    results.forEach((j) => {
      expect(j.workMode).toBe("Remote");
      expect(j.access).toContain("flexible_hours");
    });
  });
});

describe("Candidate Recommendation Engine (recommendJobs)", () => {
  it("returns top recommended jobs ordered by score descending", () => {
    const recommendations = recommendJobs(DEFAULT_PROFILE, 5);
    expect(recommendations.length).toBeLessThanOrEqual(5);
    expect(recommendations.length).toBeGreaterThan(0);

    for (let i = 0; i < recommendations.length - 1; i++) {
      expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
    }
  });

  it("boosts score when candidate skills match role requirements", () => {
    const customProfile = {
      ...DEFAULT_PROFILE,
      skills: ["Python", "FastAPI", "PostgreSQL"],
      workPreference: "Remote" as const,
      preferredLocation: "Bengaluru",
    };
    const recommendations = recommendJobs(customProfile, 10);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].score).toBeGreaterThan(0);
  });
});

describe("Accessibility Fit Scoring (accessibilityFit)", () => {
  it("computes 100% fit when all candidate preferences are supported", () => {
    const mockJob: Job = {
      id: "test-job-1",
      title: "Accessibility Specialist",
      company: "Inclusion Inc",
      city: "Bengaluru",
      workMode: "Remote",
      employment: "Full-time",
      experience: "2-5 years",
      category: "Engineering",
      description: "Test description",
      salary: "₹18-24 LPA",
      posted: "1d ago",
      transparencyLevel: "verified",
      accessSource: "Verified by AccessPath",
      access: ["screen_reader", "flexible_hours", "quiet_workspace"],
      inclusion: ["pwd_friendly"],
      requiredSkills: ["Accessibility", "WCAG"],
      preferredSkills: ["ARIA"],
    };

    const preferences = ["screen_reader", "flexible_hours"];
    const fit = accessibilityFit(preferences, mockJob);

    expect(fit.score).toBe(100);
    expect(fit.fitScore).toBe(100);
    expect(fit.hasPreferences).toBe(true);
    expect(fit.availableCount).toBe(2);
    expect(fit.missing.length).toBe(0);
  });

  it("computes 0% score when no preferences match", () => {
    const mockJob: Job = {
      id: "test-job-2",
      title: "Warehouse Associate",
      company: "Logistics Hub",
      city: "Mumbai",
      workMode: "On-site",
      employment: "Full-time",
      experience: "Fresher",
      category: "Operations",
      description: "Test description",
      salary: "₹3-4 LPA",
      posted: "2d ago",
      transparencyLevel: "employer",
      accessSource: "Employer specified",
      access: ["accessible_parking"],
      inclusion: [],
      requiredSkills: ["Inventory"],
      preferredSkills: [],
    };

    const preferences = ["screen_reader", "sign_interpreter"];
    const fit = accessibilityFit(preferences, mockJob);

    expect(fit.score).toBe(0);
    expect(fit.availableCount).toBe(0);
    expect(fit.missing.length).toBe(2);
  });

  it("normalises legacy and descriptive preference names", () => {
    const normalised = normalisePrefs(["captions for meetings", "quiet workspace"]);
    expect(normalised).toContain("captioned_meetings");
    expect(normalised).toContain("quiet_workspace");
  });

  it("translates preferences into human readable labels", () => {
    const labels = prefLabels(["screen_reader", "flexible_hours"]);
    expect(labels).toContain("Screen-reader friendly");
    expect(labels).toContain("Flexible hours");
  });
});
