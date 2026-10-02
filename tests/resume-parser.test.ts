import { describe, it, expect } from "vitest";
import { parseResumeText, DEMO_RESUMES } from "@/lib/resume-parser";

describe("Resume Parser", () => {
  it("includes preferredLocation for all preconfigured DEMO_RESUMES", () => {
    for (const demo of DEMO_RESUMES) {
      expect(demo.parsed.preferredLocation).toBeDefined();
      expect(typeof demo.parsed.preferredLocation).toBe("string");
      expect(demo.parsed.preferredLocation.length).toBeGreaterThan(0);
    }
  });

  it("extracts email, skills, and experience band from unstructured text", () => {
    const sampleText = `
      Atharva Chaudhari
      Email: atharva@example.com
      Frontend Engineer with 3 years of experience in building accessible interfaces.
      Skills: React, TypeScript, Tailwind CSS, Accessibility, WCAG.
      Education: B.Tech in Computer Science from Pune University.
      Preferred Location: Mumbai or Remote.
    `;

    const parsed = parseResumeText(sampleText);
    expect(parsed.email).toBe("atharva@example.com");
    expect(parsed.skills).toContain("React");
    expect(parsed.skills).toContain("TypeScript");
    expect(parsed.skills).toContain("Accessibility");
    expect(parsed.experienceBand).toBe("2-5 years");
    expect(parsed.preferredLocation.toLowerCase()).toContain("mumbai");
  });
});
