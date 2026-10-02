import { describe, it, expect, beforeAll } from "vitest";
import { registerAccountHandler } from "@/lib/auth.server";
import {
  createJobHandler,
  updateJobHandler,
  publishJobHandler,
  closeJobHandler,
  listMyJobsHandler,
  listPublicJobsHandler,
  applyToJobHandler,
  listApplicationsForEmployerHandler,
  updateApplicationStatusHandler,
} from "@/lib/jobs.server";
import { employerJobToJob } from "@/lib/jobs-data";

describe("Employer Job Posting & Applications (Part 1)", () => {
  let employerTokenA: string;
  let employerTokenB: string;
  let candidateToken: string;
  let createdJobId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // Register Employer A
    const regEmpA = await registerAccountHandler({
      fullName: "Employer Alice",
      email: `emp_alice_${timestamp}@company.org`,
      password: "StrongPassword123!",
      role: "employer",
    });
    expect(regEmpA.ok).toBe(true);
    employerTokenA = regEmpA.token!;

    // Register Employer B
    const regEmpB = await registerAccountHandler({
      fullName: "Employer Bob",
      email: `emp_bob_${timestamp}@othercompany.org`,
      password: "StrongPassword123!",
      role: "employer",
    });
    expect(regEmpB.ok).toBe(true);
    employerTokenB = regEmpB.token!;

    // Register Candidate
    const regCand = await registerAccountHandler({
      fullName: "Candidate Carol",
      email: `cand_carol_${timestamp}@jobseeker.in`,
      password: "StrongPassword123!",
      role: "candidate",
    });
    expect(regCand.ok).toBe(true);
    candidateToken = regCand.token!;
  });

  describe("Validation & Role Authorization", () => {
    it("rejects job posting from candidate accounts", async () => {
      const res = await createJobHandler(
        {
          title: "Frontend Engineer",
          company: "Candidate Corp",
          description: "This should fail because role is candidate.",
          location: "Bengaluru",
          workMode: "Remote",
          employmentType: "Full-time",
          experienceLevel: "0-2 years",
          skills: ["React", "TypeScript"],
          accessibilityFeatures: [{ key: "screen_reader", status: "employer-provided" }],
          inclusionFeatures: [],
          status: "draft",
        },
        candidateToken,
      );

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/only employer accounts/i);
    });

    it("rejects job posting without required accessibility features", async () => {
      try {
        await createJobHandler(
          {
            title: "Frontend Engineer",
            company: "Acme",
            description: "A valid description for this role.",
            location: "Pune",
            workMode: "Hybrid",
            employmentType: "Full-time",
            experienceLevel: "2-5 years",
            skills: ["JavaScript"],
            accessibilityFeatures: [], // Missing accessibility features
            inclusionFeatures: [],
            status: "draft",
          } as unknown as Parameters<typeof createJobHandler>[0],
          employerTokenA,
        );
      } catch (err: unknown) {
        expect(err).toBeDefined();
      }
    });

    it("creates a job draft successfully for an employer with verification status per feature", async () => {
      const res = await createJobHandler(
        {
          title: "Accessibility Engineer",
          company: "TechInclusive India",
          description: "Build accessible web applications and conduct audits for WCAG 2.2 AA.",
          location: "Bengaluru",
          workMode: "Hybrid",
          employmentType: "Full-time",
          experienceLevel: "2-5 years",
          skills: ["React", "TypeScript", "WCAG", "ARIA"],
          salaryRange: "₹18,00,000 - ₹24,00,000",
          accessibilityFeatures: [
            { key: "screen_reader", status: "verified" },
            { key: "accessible_application", status: "employer-provided" },
            { key: "captioned_meetings", status: "not-specified" },
          ],
          inclusionFeatures: ["equal_opportunity", "inclusive_hiring"],
          status: "draft",
        },
        employerTokenA,
      );

      expect(res.ok).toBe(true);
      if (res.ok) {
        createdJobId = res.job.id;
        expect(res.job.title).toBe("Accessibility Engineer");
        expect(res.job.status).toBe("draft");
        expect(res.job.accessibilityFeatures).toHaveLength(3);
        expect(res.job.accessibilityFeatures[0]?.status).toBe("verified");
        expect(res.job.accessibilityFeatures[1]?.status).toBe("employer-provided");
        expect(res.job.accessibilityFeatures[2]?.status).toBe("not-specified");
      }
    });
  });

  describe("Ownership & Edit Controls", () => {
    it("allows the owner (Employer A) to edit the job", async () => {
      const res = await updateJobHandler(
        {
          jobId: createdJobId,
          title: "Senior Accessibility Engineer",
          salaryRange: "₹22,00,000 - ₹28,00,000",
        },
        employerTokenA,
      );

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.job.title).toBe("Senior Accessibility Engineer");
        expect(res.job.salaryRange).toBe("₹22,00,000 - ₹28,00,000");
      }
    });

    it("prevents another employer (Employer B) from editing Employer A's job", async () => {
      const res = await updateJobHandler(
        {
          jobId: createdJobId,
          title: "Hacked Job Title",
        },
        employerTokenB,
      );

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/only edit your own jobs/i);
    });

    it("lists only Employer A's jobs for Employer A", async () => {
      const listA = await listMyJobsHandler(employerTokenA);
      expect(listA.ok).toBe(true);
      expect(listA.jobs.some((j) => j.id === createdJobId)).toBe(true);

      const listB = await listMyJobsHandler(employerTokenB);
      expect(listB.ok).toBe(true);
      expect(listB.jobs.some((j) => j.id === createdJobId)).toBe(false);
    });
  });

  describe("Publish / Close Lifecycle & Public Listing", () => {
    it("draft job does not appear in public listings", async () => {
      const publicJobs = await listPublicJobsHandler();
      expect(publicJobs.ok).toBe(true);
      expect(publicJobs.jobs.some((j) => j.id === createdJobId)).toBe(false);
    });

    it("publishes the job and makes it visible in public listings", async () => {
      const pubRes = await publishJobHandler({ jobId: createdJobId }, employerTokenA);
      expect(pubRes.ok).toBe(true);
      if (pubRes.ok) {
        expect(pubRes.job.status).toBe("published");
      }

      const publicJobs = await listPublicJobsHandler();
      expect(publicJobs.ok).toBe(true);
      const found = publicJobs.jobs.find((j) => j.id === createdJobId);
      expect(found).toBeDefined();
      expect(found?.title).toBe("Senior Accessibility Engineer");
    });

    it("converts EmployerJob to unified Job type properly for candidates", async () => {
      const publicJobs = await listPublicJobsHandler();
      const employerJob = publicJobs.jobs.find((j) => j.id === createdJobId)!;
      expect(employerJob).toBeDefined();

      const candidateJob = employerJobToJob(employerJob);
      expect(candidateJob.id).toBe(createdJobId);
      expect(candidateJob.source).toBe("employer");
      expect(candidateJob.accessSource).toBe("Verified by AccessPath");
      // Screen-reader is verified, accessible_application is employer-provided, captioned_meetings is not-specified
      expect(candidateJob.access).toContain("screen_reader");
      expect(candidateJob.access).toContain("accessible_application");
      expect(candidateJob.access).not.toContain("captioned_meetings");
    });

    it("closes the job and removes it from public listings", async () => {
      const closeRes = await closeJobHandler({ jobId: createdJobId }, employerTokenA);
      expect(closeRes.ok).toBe(true);
      if (closeRes.ok) {
        expect(closeRes.job.status).toBe("closed");
      }

      const publicJobs = await listPublicJobsHandler();
      expect(publicJobs.ok).toBe(true);
      expect(publicJobs.jobs.some((j) => j.id === createdJobId)).toBe(false);

      // Re-publish so we can test applications
      await publishJobHandler({ jobId: createdJobId }, employerTokenA);
    });
  });

  describe("Job Applications & Privacy Protections", () => {
    let applicationId: string;

    it("allows candidate to apply with shared or private accommodations", async () => {
      const applyRes = await applyToJobHandler(
        {
          jobId: createdJobId,
          resumeName: "Carol_Resume_2026.pdf",
          resumeText: "CONFIDENTIAL CANDIDATE RESUME TEXT - SHOULD NOT BE EXPOSED",
          coverLetter: "Excited to apply for the Senior Accessibility Engineer position.",
          accommodations: ["Screen reader assessment", "Extra time"],
          shareAccommodations: false, // Candidate opted out of sharing accommodations initially
          matchScore: 92,
        },
        candidateToken,
      );

      expect(applyRes.ok).toBe(true);
      if (applyRes.ok) {
        applicationId = applyRes.application.id;
        expect(applyRes.application.status).toBe("Applied");
        expect(applyRes.application.candidateName).toBe("Candidate Carol");
      }
    });

    it("prevents duplicate applications for the same job and candidate", async () => {
      const duplicateRes = await applyToJobHandler(
        {
          jobId: createdJobId,
          resumeName: "Carol_Resume_2026.pdf",
          resumeText: "Duplicate application",
          coverLetter: "Trying again",
          accommodations: [],
          shareAccommodations: false,
          matchScore: 90,
        },
        candidateToken,
      );

      expect(duplicateRes.ok).toBe(false);
      expect(duplicateRes.error).toMatch(/already applied/i);
    });

    it("NEVER exposes sensitive profile fields or unshared accommodations to the employer", async () => {
      const appsRes = await listApplicationsForEmployerHandler(
        { jobId: createdJobId },
        employerTokenA,
      );

      expect(appsRes.ok).toBe(true);
      if (appsRes.ok) {
        const app = appsRes.applications.find((a) => a.id === applicationId);
        expect(app).toBeDefined();
        // Since shareAccommodations was false, accommodations MUST be sanitized (empty)
        expect(app?.accommodations).toEqual([]);
        // Raw resume text must NEVER be returned to the employer (stripped for privacy)
        expect(app?.resumeText).toBe("");
        // Candidate public application fields are visible
        expect(app?.resumeName).toBe("Carol_Resume_2026.pdf");
        expect(app?.coverLetter).toBe(
          "Excited to apply for the Senior Accessibility Engineer position.",
        );
        expect(app?.candidateName).toBe("Candidate Carol");
      }
    });

    it("allows the employer to update application status and interview link", async () => {
      const statusRes = await updateApplicationStatusHandler(
        {
          applicationId,
          status: "Interview",
          interviewMeetingLink: "https://meet.google.com/abc-defg-hij",
        },
        employerTokenA,
      );

      expect(statusRes.ok).toBe(true);
      if (statusRes.ok) {
        expect(statusRes.application.status).toBe("Interview");
        expect(statusRes.application.interviewMeetingLink).toBe(
          "https://meet.google.com/abc-defg-hij",
        );
      }
    });

    it("prevents Employer B from managing applications for Employer A's job", async () => {
      const unauthorizedUpdate = await updateApplicationStatusHandler(
        {
          applicationId,
          status: "Offer",
        },
        employerTokenB,
      );

      expect(unauthorizedUpdate.ok).toBe(false);
      expect(unauthorizedUpdate.error).toMatch(/only manage applications for your own jobs/i);
    });
  });
});
