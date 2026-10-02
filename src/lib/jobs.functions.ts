import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Server Function Wrappers for Jobs & Applications
// Uses the same createServerFn pattern as auth.functions.ts
// ---------------------------------------------------------------------------

export const createJob = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        title: z.string().trim().min(2).max(200),
        company: z.string().trim().min(1).max(200),
        description: z.string().trim().min(10).max(5000),
        location: z.string().trim().max(100).default(""),
        workMode: z.enum(["Remote", "Hybrid", "On-site"]),
        employmentType: z.enum(["Full-time", "Part-time", "Internship", "Contract"]),
        experienceLevel: z.enum(["Fresher", "0-2 years", "2-5 years", "5+ years"]),
        skills: z.array(z.string().trim().min(1)).min(1).max(30),
        salaryRange: z.string().trim().max(100).optional(),
        accessibilityFeatures: z.array(
          z.object({
            key: z.string().min(1),
            status: z.enum(["verified", "employer-provided", "not-specified"]),
          }),
        ),
        inclusionFeatures: z.array(z.string().trim()).default([]),
        status: z.enum(["draft", "published", "closed"]).default("draft"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createJobHandler } = await import("./jobs.server");
    return createJobHandler(data);
  });

export const updateJob = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        jobId: z.string().min(1),
        title: z.string().trim().min(2).max(200).optional(),
        company: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().min(10).max(5000).optional(),
        location: z.string().trim().max(100).optional(),
        workMode: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
        employmentType: z.enum(["Full-time", "Part-time", "Internship", "Contract"]).optional(),
        experienceLevel: z.enum(["Fresher", "0-2 years", "2-5 years", "5+ years"]).optional(),
        skills: z.array(z.string().trim().min(1)).min(1).max(30).optional(),
        salaryRange: z.string().trim().max(100).optional(),
        accessibilityFeatures: z
          .array(
            z.object({
              key: z.string().min(1),
              status: z.enum(["verified", "employer-provided", "not-specified"]),
            }),
          )
          .optional(),
        inclusionFeatures: z.array(z.string().trim()).optional(),
        status: z.enum(["draft", "published", "closed"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { updateJobHandler } = await import("./jobs.server");
    return updateJobHandler(data);
  });

export const publishJob = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ jobId: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { publishJobHandler } = await import("./jobs.server");
    return publishJobHandler(data);
  });

export const closeJob = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ jobId: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { closeJobHandler } = await import("./jobs.server");
    return closeJobHandler(data);
  });

export const listMyJobs = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const { listMyJobsHandler } = await import("./jobs.server");
    return listMyJobsHandler();
  });

export const listPublicJobs = createServerFn({ method: "GET" }).handler(async () => {
  const { listPublicJobsHandler } = await import("./jobs.server");
  return listPublicJobsHandler();
});

export const applyToJob = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        jobId: z.string().min(1),
        resumeName: z.string().trim().max(200).default(""),
        resumeText: z.string().trim().max(50000).default(""),
        coverLetter: z.string().trim().max(5000).default(""),
        accommodations: z.array(z.string().trim()).default([]),
        shareAccommodations: z.boolean().default(false),
        matchScore: z.number().min(0).max(100).default(0),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { applyToJobHandler } = await import("./jobs.server");
    return applyToJobHandler(data);
  });

export const listApplicationsForEmployer = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ jobId: z.string().optional() })
      .default({})
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { listApplicationsForEmployerHandler } = await import("./jobs.server");
    return listApplicationsForEmployerHandler(data);
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        applicationId: z.string().min(1),
        status: z.enum([
          "Applied",
          "Under Review",
          "Shortlisted",
          "Interview",
          "Offer",
          "Rejected",
        ]),
        interviewMeetingLink: z.string().url().optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { updateApplicationStatusHandler } = await import("./jobs.server");
    return updateApplicationStatusHandler(data);
  });

export const getMyApplications = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const { getMyApplicationsHandler } = await import("./jobs.server");
    return getMyApplicationsHandler();
  });
