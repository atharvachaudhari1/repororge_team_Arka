import { z } from "zod";
import { ObjectId } from "mongodb";
import { getSessionCookieToken, isUserAdmin } from "./auth.server";
import { isMongoConfigured, getMongoDb } from "./mongodb.server";
import { sendEmail } from "./mailer.server";
import type { AccountRole } from "./auth.functions";
import type {
  AccessFeature,
  Employment,
  ExperienceBand,
  InclusionFeature,
  WorkMode,
} from "./jobs-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VerificationStatus = "verified" | "employer-provided" | "not-specified";

export type AccessibilityFeatureEntry = {
  key: AccessFeature;
  status: VerificationStatus;
};

export type JobStatus = "draft" | "published" | "closed";

export type EmployerJob = {
  id: string;
  employerId: string;
  title: string;
  company: string;
  description: string;
  location: string;
  workMode: WorkMode;
  employmentType: Employment;
  experienceLevel: ExperienceBand;
  skills: string[];
  salaryRange?: string | undefined;
  accessibilityFeatures: AccessibilityFeatureEntry[];
  inclusionFeatures: InclusionFeature[];
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationStatus =
  "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Offer" | "Rejected";

export type StoredApplication = {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  resumeName: string;
  resumeText: string;
  coverLetter: string;
  accommodations: string[];
  shareAccommodations: boolean;
  matchScore: number;
  status: ApplicationStatus;
  interviewMeetingLink?: string | undefined;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const WORK_MODES: [WorkMode, ...WorkMode[]] = ["Remote", "Hybrid", "On-site"];
const EMPLOYMENT_TYPES: [Employment, ...Employment[]] = [
  "Full-time",
  "Part-time",
  "Internship",
  "Contract",
];
const EXPERIENCE_LEVELS: [ExperienceBand, ...ExperienceBand[]] = [
  "Fresher",
  "0-2 years",
  "2-5 years",
  "5+ years",
];
const JOB_STATUSES: [JobStatus, ...JobStatus[]] = ["draft", "published", "closed"];
const APPLICATION_STATUSES_ENUM: [ApplicationStatus, ...ApplicationStatus[]] = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Offer",
  "Rejected",
];

export const createJobSchema = z.object({
  title: z.string().trim().min(2, "Job title is required").max(200),
  company: z.string().trim().min(1, "Company name is required").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  location: z.string().trim().max(100).default(""),
  workMode: z.enum(WORK_MODES),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  skills: z.array(z.string().trim().min(1)).min(1, "At least one skill is required").max(30),
  salaryRange: z.string().trim().max(100).optional(),
  accessibilityFeatures: z
    .array(
      z.object({
        key: z.string().min(1),
        status: z.enum(["verified", "employer-provided", "not-specified"]),
      }),
    )
    .min(1, "Select at least one accessibility feature"),
  inclusionFeatures: z.array(z.string().trim()).default([]),
  status: z.enum(JOB_STATUSES).default("draft"),
});

export const updateJobSchema = createJobSchema.partial().extend({
  jobId: z.string().min(1),
});

export const applyToJobSchema = z.object({
  jobId: z.string().min(1),
  resumeName: z.string().trim().max(200).default(""),
  resumeText: z.string().trim().max(50000).default(""),
  coverLetter: z.string().trim().max(5000).default(""),
  accommodations: z.array(z.string().trim()).default([]),
  shareAccommodations: z.boolean().default(false),
  matchScore: z.number().min(0).max(100).default(0),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(APPLICATION_STATUSES_ENUM),
  interviewMeetingLink: z.string().url().optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SqliteDatabase = import("better-sqlite3").Database;

async function getDatabase(): Promise<SqliteDatabase> {
  const { getDatabase: getDb } = await import("./auth.server");
  return getDb();
}

function uuid(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appUuid(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getSessionUser(explicitToken?: string): Promise<{
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  isAdmin: boolean;
} | null> {
  const token = explicitToken || getSessionCookieToken();
  if (!token) return null;

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const sessionDoc = await mongo.collection("sessions").findOne({
        token,
        expiresAt: { $gt: new Date() },
      });
      if (!sessionDoc) return null;

      let userDoc = null;
      try {
        userDoc = await mongo
          .collection("users")
          .findOne({ _id: new ObjectId(sessionDoc["userId"] as string) });
      } catch {
        userDoc = await mongo.collection("users").findOne({ id: sessionDoc["userId"] });
      }
      if (!userDoc) return null;

      const activeRole = (sessionDoc["role"] || userDoc["role"]) as AccountRole;
      return {
        id: userDoc["_id"].toString(),
        email: String(userDoc["email"]),
        fullName: String(userDoc["fullName"] || userDoc["full_name"]),
        role: activeRole,
        isAdmin: isUserAdmin(userDoc),
      };
    } catch {
      // fall through to SQLite
    }
  }

  // SQLite fallback
  const db = await getDatabase();
  type UserRow = {
    id: number;
    email: string;
    full_name: string;
    role: AccountRole;
    is_admin?: number;
  };
  const row = db
    .prepare(
      `SELECT users.*, sessions.token
       FROM sessions JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ? AND sessions.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as UserRow | undefined;
  if (!row) return null;

  return {
    id: String(row.id),
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isAdmin: isUserAdmin(row as Record<string, unknown>),
  };
}

/** Simple write-rate limiter keyed on userId. 10 writes per 5 minutes. */
async function checkWriteRateLimit(userId: string): Promise<boolean> {
  const key = `job_write:${userId}`;
  const windowMs = 5 * 60 * 1000;
  const LIMIT = 10;
  const now = Date.now();

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const cutoff = new Date(now - windowMs);
      await mongo.collection("ai_rate_limits").deleteMany({
        key: { $regex: /^job_write:/ },
        windowStart: { $lt: cutoff },
      });
      const rec = await mongo.collection("ai_rate_limits").findOne({ key });
      if (rec && (rec["count"] as number) >= LIMIT) return false;
      await mongo
        .collection("ai_rate_limits")
        .updateOne(
          { key },
          { $inc: { count: 1 }, $setOnInsert: { windowStart: new Date() } },
          { upsert: true },
        );
      return true;
    } catch {
      // fall through
    }
  }

  const db = await getDatabase();
  const cutoffIso = new Date(now - windowMs).toISOString();
  db.prepare("DELETE FROM ai_rate_limits WHERE key LIKE 'job_write:%' AND window_start < ?").run(
    cutoffIso,
  );
  const rec = db.prepare("SELECT count FROM ai_rate_limits WHERE key = ?").get(key) as
    { count: number } | undefined;
  if (rec && rec.count >= LIMIT) return false;
  db.prepare(
    `INSERT INTO ai_rate_limits (key, count, window_start)
     VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET count = count + 1`,
  ).run(key, rec ? "" : new Date().toISOString());
  return true;
}

// ---------------------------------------------------------------------------
// SQLite Table Init
// ---------------------------------------------------------------------------

let sqliteTablesCreated = false;

async function ensureSqliteTables(): Promise<void> {
  if (sqliteTablesCreated) return;
  const db = await getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS employer_jobs (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      work_mode TEXT NOT NULL DEFAULT 'Remote',
      employment_type TEXT NOT NULL DEFAULT 'Full-time',
      experience_level TEXT NOT NULL DEFAULT 'Fresher',
      skills TEXT NOT NULL DEFAULT '[]',
      salary_range TEXT,
      accessibility_features TEXT NOT NULL DEFAULT '[]',
      inclusion_features TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      candidate_name TEXT NOT NULL DEFAULT '',
      candidate_email TEXT NOT NULL DEFAULT '',
      resume_name TEXT NOT NULL DEFAULT '',
      resume_text TEXT NOT NULL DEFAULT '',
      cover_letter TEXT NOT NULL DEFAULT '',
      accommodations TEXT NOT NULL DEFAULT '[]',
      share_accommodations INTEGER NOT NULL DEFAULT 0,
      match_score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Applied',
      interview_meeting_link TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  sqliteTablesCreated = true;
}

// ---------------------------------------------------------------------------
// Helpers: Convert between DB doc and typed result
// ---------------------------------------------------------------------------

function docToEmployerJob(doc: Record<string, unknown>): EmployerJob {
  return {
    id: String(doc["id"] || doc["_id"]),
    employerId: String(doc["employerId"] || doc["employer_id"]),
    title: String(doc["title"]),
    company: String(doc["company"]),
    description: String(doc["description"]),
    location: String(doc["location"] || ""),
    workMode: (doc["workMode"] || doc["work_mode"] || "Remote") as WorkMode,
    employmentType: (doc["employmentType"] || doc["employment_type"] || "Full-time") as Employment,
    experienceLevel: (doc["experienceLevel"] ||
      doc["experience_level"] ||
      "Fresher") as ExperienceBand,
    skills: parseJsonArray(doc["skills"]),
    salaryRange:
      doc["salaryRange"] != null
        ? String(doc["salaryRange"])
        : doc["salary_range"] != null
          ? String(doc["salary_range"])
          : undefined,
    accessibilityFeatures: parseJsonArray(
      doc["accessibilityFeatures"] || doc["accessibility_features"],
    ) as unknown as AccessibilityFeatureEntry[],
    inclusionFeatures: parseJsonArray(
      doc["inclusionFeatures"] || doc["inclusion_features"],
    ) as unknown as InclusionFeature[],
    status: (doc["status"] || "draft") as JobStatus,
    createdAt: String(doc["createdAt"] || doc["created_at"]),
    updatedAt: String(doc["updatedAt"] || doc["updated_at"]),
  };
}

function docToApplication(doc: Record<string, unknown>): StoredApplication {
  return {
    id: String(doc["id"] || doc["_id"]),
    jobId: String(doc["jobId"] || doc["job_id"]),
    candidateId: String(doc["candidateId"] || doc["candidate_id"]),
    candidateName: String(doc["candidateName"] || doc["candidate_name"] || ""),
    candidateEmail: String(doc["candidateEmail"] || doc["candidate_email"] || ""),
    resumeName: String(doc["resumeName"] || doc["resume_name"] || ""),
    resumeText: String(doc["resumeText"] || doc["resume_text"] || ""),
    coverLetter: String(doc["coverLetter"] || doc["cover_letter"] || ""),
    accommodations: parseJsonArray(doc["accommodations"]),
    shareAccommodations: Boolean(doc["shareAccommodations"] || doc["share_accommodations"]),
    matchScore: Number(doc["matchScore"] || doc["match_score"] || 0),
    status: (doc["status"] || "Applied") as ApplicationStatus,
    interviewMeetingLink:
      doc["interviewMeetingLink"] != null
        ? String(doc["interviewMeetingLink"])
        : doc["interview_meeting_link"] != null
          ? String(doc["interview_meeting_link"])
          : undefined,
    createdAt: String(doc["createdAt"] || doc["created_at"]),
    updatedAt: String(doc["updatedAt"] || doc["updated_at"]),
  };
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Strip private candidate data before returning applications to employers.
 * NEVER expose: accessibilityPreferences, pronouns, gender, legalName.
 * Only show accommodations if the candidate toggled shareAccommodations on.
 */
function sanitizeApplicationForEmployer(app: StoredApplication): StoredApplication {
  return {
    ...app,
    // Never include raw resume text to employer — just the filename
    resumeText: "",
    // Only show accommodations if explicitly shared
    accommodations: app.shareAccommodations ? app.accommodations : [],
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function createJobHandler(
  data: z.infer<typeof createJobSchema>,
  explicitToken?: string,
): Promise<{ ok: true; job: EmployerJob } | { ok: false; error: string }> {
  const user = await getSessionUser(explicitToken);
  if (!user) return { ok: false, error: "Please sign in to post a job." };
  if (user.role !== "employer" && !user.isAdmin) {
    return { ok: false, error: "Only employer accounts can post jobs." };
  }

  const allowed = await checkWriteRateLimit(user.id);
  if (!allowed) {
    return {
      ok: false,
      error: "Rate limit reached: Too many job posts. Please wait a few minutes.",
    };
  }

  const id = uuid();
  const now = new Date().toISOString();
  const job: EmployerJob = {
    id,
    employerId: user.id,
    title: data.title,
    company: data.company,
    description: data.description,
    location: data.workMode === "Remote" ? "Remote (India)" : data.location,
    workMode: data.workMode,
    employmentType: data.employmentType,
    experienceLevel: data.experienceLevel,
    skills: data.skills,
    salaryRange: data.salaryRange || undefined,
    accessibilityFeatures: data.accessibilityFeatures as AccessibilityFeatureEntry[],
    inclusionFeatures: data.inclusionFeatures as InclusionFeature[],
    status: data.status || "draft",
    createdAt: now,
    updatedAt: now,
  };

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      await mongo.collection("employer_jobs").insertOne({ ...job });
      return { ok: true, job };
    } catch (err) {
      console.warn("MongoDB createJob error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();
  db.prepare(
    `INSERT INTO employer_jobs
     (id, employer_id, title, company, description, location, work_mode, employment_type,
      experience_level, skills, salary_range, accessibility_features, inclusion_features,
      status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    job.id,
    job.employerId,
    job.title,
    job.company,
    job.description,
    job.location,
    job.workMode,
    job.employmentType,
    job.experienceLevel,
    JSON.stringify(job.skills),
    job.salaryRange || null,
    JSON.stringify(job.accessibilityFeatures),
    JSON.stringify(job.inclusionFeatures),
    job.status,
    job.createdAt,
    job.updatedAt,
  );

  return { ok: true, job };
}

export async function updateJobHandler(
  data: z.infer<typeof updateJobSchema>,
  explicitToken?: string,
): Promise<{ ok: true; job: EmployerJob } | { ok: false; error: string }> {
  const user = await getSessionUser(explicitToken);
  if (!user) return { ok: false, error: "Please sign in." };
  if (user.role !== "employer" && !user.isAdmin) {
    return { ok: false, error: "Only employer accounts can edit jobs." };
  }

  const now = new Date().toISOString();

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const existing = await mongo.collection("employer_jobs").findOne({ id: data.jobId });
      if (!existing) return { ok: false, error: "Job not found." };
      if (String(existing["employerId"]) !== user.id && !user.isAdmin) {
        return { ok: false, error: "You can only edit your own jobs." };
      }

      const updateFields: Record<string, unknown> = { updatedAt: now };
      if (data.title !== undefined) updateFields["title"] = data.title;
      if (data.company !== undefined) updateFields["company"] = data.company;
      if (data.description !== undefined) updateFields["description"] = data.description;
      if (data.location !== undefined) updateFields["location"] = data.location;
      if (data.workMode !== undefined) {
        updateFields["workMode"] = data.workMode;
        if (data.workMode === "Remote") updateFields["location"] = "Remote (India)";
      }
      if (data.employmentType !== undefined) updateFields["employmentType"] = data.employmentType;
      if (data.experienceLevel !== undefined)
        updateFields["experienceLevel"] = data.experienceLevel;
      if (data.skills !== undefined) updateFields["skills"] = data.skills;
      if (data.salaryRange !== undefined) updateFields["salaryRange"] = data.salaryRange;
      if (data.accessibilityFeatures !== undefined)
        updateFields["accessibilityFeatures"] = data.accessibilityFeatures;
      if (data.inclusionFeatures !== undefined)
        updateFields["inclusionFeatures"] = data.inclusionFeatures;
      if (data.status !== undefined) updateFields["status"] = data.status;

      await mongo.collection("employer_jobs").updateOne({ id: data.jobId }, { $set: updateFields });
      const updated = await mongo.collection("employer_jobs").findOne({ id: data.jobId });
      return { ok: true, job: docToEmployerJob(updated as Record<string, unknown>) };
    } catch (err) {
      console.warn("MongoDB updateJob error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();
  const existing = db.prepare("SELECT * FROM employer_jobs WHERE id = ?").get(data.jobId) as
    Record<string, unknown> | undefined;
  if (!existing) return { ok: false, error: "Job not found." };
  if (String(existing["employer_id"]) !== user.id && !user.isAdmin) {
    return { ok: false, error: "You can only edit your own jobs." };
  }

  const fields: string[] = ["updated_at = ?"];
  const values: unknown[] = [now];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.company !== undefined) {
    fields.push("company = ?");
    values.push(data.company);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.location !== undefined) {
    fields.push("location = ?");
    values.push(data.location);
  }
  if (data.workMode !== undefined) {
    fields.push("work_mode = ?");
    values.push(data.workMode);
    if (data.workMode === "Remote") {
      fields.push("location = ?");
      values.push("Remote (India)");
    }
  }
  if (data.employmentType !== undefined) {
    fields.push("employment_type = ?");
    values.push(data.employmentType);
  }
  if (data.experienceLevel !== undefined) {
    fields.push("experience_level = ?");
    values.push(data.experienceLevel);
  }
  if (data.skills !== undefined) {
    fields.push("skills = ?");
    values.push(JSON.stringify(data.skills));
  }
  if (data.salaryRange !== undefined) {
    fields.push("salary_range = ?");
    values.push(data.salaryRange);
  }
  if (data.accessibilityFeatures !== undefined) {
    fields.push("accessibility_features = ?");
    values.push(JSON.stringify(data.accessibilityFeatures));
  }
  if (data.inclusionFeatures !== undefined) {
    fields.push("inclusion_features = ?");
    values.push(JSON.stringify(data.inclusionFeatures));
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    values.push(data.status);
  }

  values.push(data.jobId);
  db.prepare(`UPDATE employer_jobs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  const updated = db.prepare("SELECT * FROM employer_jobs WHERE id = ?").get(data.jobId) as Record<
    string,
    unknown
  >;
  return { ok: true, job: docToEmployerJob(updated) };
}

export async function publishJobHandler(
  data: {
    jobId: string;
  },
  explicitToken?: string,
): Promise<{ ok: true; job: EmployerJob } | { ok: false; error: string }> {
  return updateJobHandler({ jobId: data.jobId, status: "published" }, explicitToken);
}

export async function closeJobHandler(
  data: {
    jobId: string;
  },
  explicitToken?: string,
): Promise<{ ok: true; job: EmployerJob } | { ok: false; error: string }> {
  return updateJobHandler({ jobId: data.jobId, status: "closed" }, explicitToken);
}

export async function listMyJobsHandler(explicitToken?: string): Promise<{
  ok: true;
  jobs: EmployerJob[];
}> {
  const user = await getSessionUser(explicitToken);
  if (!user) return { ok: true, jobs: [] };

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const docs = await mongo
        .collection("employer_jobs")
        .find({ employerId: user.id })
        .sort({ updatedAt: -1 })
        .toArray();
      return { ok: true, jobs: docs.map((d) => docToEmployerJob(d as Record<string, unknown>)) };
    } catch (err) {
      console.warn("MongoDB listMyJobs error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();
  const rows = db
    .prepare("SELECT * FROM employer_jobs WHERE employer_id = ? ORDER BY updated_at DESC")
    .all(user.id) as Record<string, unknown>[];
  return { ok: true, jobs: rows.map(docToEmployerJob) };
}

export async function listPublicJobsHandler(): Promise<{
  ok: true;
  jobs: EmployerJob[];
}> {
  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const docs = await mongo
        .collection("employer_jobs")
        .find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();
      return { ok: true, jobs: docs.map((d) => docToEmployerJob(d as Record<string, unknown>)) };
    } catch (err) {
      console.warn("MongoDB listPublicJobs error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();
  const rows = db
    .prepare(
      "SELECT * FROM employer_jobs WHERE status = 'published' ORDER BY created_at DESC LIMIT 200",
    )
    .all() as Record<string, unknown>[];
  return { ok: true, jobs: rows.map(docToEmployerJob) };
}

export async function applyToJobHandler(
  data: z.infer<typeof applyToJobSchema>,
  explicitToken?: string,
): Promise<{ ok: true; application: StoredApplication } | { ok: false; error: string }> {
  const user = await getSessionUser(explicitToken);
  if (!user) return { ok: false, error: "Please sign in to apply." };
  if (user.role !== "candidate" && !user.isAdmin) {
    return { ok: false, error: "Only candidate accounts can apply to jobs." };
  }

  const id = appUuid();
  const now = new Date().toISOString();

  const app: StoredApplication = {
    id,
    jobId: data.jobId,
    candidateId: user.id,
    candidateName: user.fullName,
    candidateEmail: user.email,
    resumeName: data.resumeName,
    resumeText: data.resumeText,
    coverLetter: data.coverLetter,
    accommodations: data.accommodations,
    shareAccommodations: data.shareAccommodations,
    matchScore: data.matchScore,
    status: "Applied",
    createdAt: now,
    updatedAt: now,
  };

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      // Check for duplicate application
      const existing = await mongo.collection("job_applications").findOne({
        jobId: data.jobId,
        candidateId: user.id,
      });
      if (existing) {
        return { ok: false, error: "You have already applied to this job." };
      }

      // Get the job to find the employer for notification
      const jobDoc = await mongo.collection("employer_jobs").findOne({ id: data.jobId });

      await mongo.collection("job_applications").insertOne({ ...app });

      // Send email notification to employer
      if (jobDoc) {
        void sendApplicationNotification(jobDoc as Record<string, unknown>, app);
      }

      return { ok: true, application: app };
    } catch (err) {
      console.warn("MongoDB applyToJob error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();

  // Check duplicate
  const existing = db
    .prepare("SELECT id FROM job_applications WHERE job_id = ? AND candidate_id = ?")
    .get(data.jobId, user.id);
  if (existing) {
    return { ok: false, error: "You have already applied to this job." };
  }

  db.prepare(
    `INSERT INTO job_applications
     (id, job_id, candidate_id, candidate_name, candidate_email, resume_name, resume_text,
      cover_letter, accommodations, share_accommodations, match_score, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    app.id,
    app.jobId,
    app.candidateId,
    app.candidateName,
    app.candidateEmail,
    app.resumeName,
    app.resumeText,
    app.coverLetter,
    JSON.stringify(app.accommodations),
    app.shareAccommodations ? 1 : 0,
    app.matchScore,
    app.status,
    app.createdAt,
    app.updatedAt,
  );

  // Try to get the job for notification
  const jobRow = db.prepare("SELECT * FROM employer_jobs WHERE id = ?").get(data.jobId);
  if (jobRow) {
    void sendApplicationNotification(jobRow as Record<string, unknown>, app);
  }

  return { ok: true, application: app };
}

export async function listApplicationsForEmployerHandler(
  data?: {
    jobId?: string | undefined;
  },
  explicitToken?: string,
): Promise<{ ok: true; applications: StoredApplication[] } | { ok: false; error: string }> {
  const user = await getSessionUser(explicitToken);
  if (!user) return { ok: false, error: "Please sign in." };
  if (user.role !== "employer" && !user.isAdmin) {
    return { ok: false, error: "Only employer accounts can view applications." };
  }

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      // First get this employer's job IDs
      const jobFilter: Record<string, unknown> = { employerId: user.id };
      if (data?.jobId) jobFilter["id"] = data.jobId;
      const myJobs = await mongo.collection("employer_jobs").find(jobFilter).toArray();
      const myJobIds = myJobs.map((j) => String(j["id"]));

      if (myJobIds.length === 0) return { ok: true, applications: [] };

      const appFilter: Record<string, unknown> = { jobId: { $in: myJobIds } };
      const docs = await mongo
        .collection("job_applications")
        .find(appFilter)
        .sort({ createdAt: -1 })
        .toArray();

      return {
        ok: true,
        applications: docs.map((d) =>
          sanitizeApplicationForEmployer(docToApplication(d as Record<string, unknown>)),
        ),
      };
    } catch (err) {
      console.warn("MongoDB listApplicationsForEmployer error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();

  let query =
    "SELECT a.* FROM job_applications a JOIN employer_jobs j ON a.job_id = j.id WHERE j.employer_id = ?";
  const params: unknown[] = [user.id];

  if (data?.jobId) {
    query += " AND a.job_id = ?";
    params.push(data.jobId);
  }
  query += " ORDER BY a.created_at DESC";

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  return {
    ok: true,
    applications: rows.map((r) => sanitizeApplicationForEmployer(docToApplication(r))),
  };
}

export async function updateApplicationStatusHandler(
  data: z.infer<typeof updateApplicationStatusSchema>,
  explicitToken?: string,
): Promise<{ ok: true; application: StoredApplication } | { ok: false; error: string }> {
  const user = await getSessionUser(explicitToken);
  if (!user) return { ok: false, error: "Please sign in." };
  if (user.role !== "employer" && !user.isAdmin) {
    return { ok: false, error: "Only employer accounts can update application status." };
  }

  const now = new Date().toISOString();

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const appDoc = await mongo.collection("job_applications").findOne({ id: data.applicationId });
      if (!appDoc) return { ok: false, error: "Application not found." };

      // Verify the employer owns the job
      const jobDoc = await mongo.collection("employer_jobs").findOne({ id: appDoc["jobId"] });
      if (!jobDoc || (String(jobDoc["employerId"]) !== user.id && !user.isAdmin)) {
        return { ok: false, error: "You can only manage applications for your own jobs." };
      }

      const updateFields: Record<string, unknown> = {
        status: data.status,
        updatedAt: now,
      };
      if (data.interviewMeetingLink !== undefined) {
        updateFields["interviewMeetingLink"] = data.interviewMeetingLink;
      }

      await mongo
        .collection("job_applications")
        .updateOne({ id: data.applicationId }, { $set: updateFields });
      const updated = await mongo
        .collection("job_applications")
        .findOne({ id: data.applicationId });
      return {
        ok: true,
        application: sanitizeApplicationForEmployer(
          docToApplication(updated as Record<string, unknown>),
        ),
      };
    } catch (err) {
      console.warn("MongoDB updateApplicationStatus error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();

  const appRow = db
    .prepare("SELECT * FROM job_applications WHERE id = ?")
    .get(data.applicationId) as Record<string, unknown> | undefined;
  if (!appRow) return { ok: false, error: "Application not found." };

  const jobRow = db
    .prepare("SELECT * FROM employer_jobs WHERE id = ?")
    .get(String(appRow["job_id"])) as Record<string, unknown> | undefined;
  if (!jobRow || (String(jobRow["employer_id"]) !== user.id && !user.isAdmin)) {
    return { ok: false, error: "You can only manage applications for your own jobs." };
  }

  const fields: string[] = ["status = ?", "updated_at = ?"];
  const values: unknown[] = [data.status, now];
  if (data.interviewMeetingLink !== undefined) {
    fields.push("interview_meeting_link = ?");
    values.push(data.interviewMeetingLink);
  }
  values.push(data.applicationId);
  db.prepare(`UPDATE job_applications SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare("SELECT * FROM job_applications WHERE id = ?")
    .get(data.applicationId) as Record<string, unknown>;
  return {
    ok: true,
    application: sanitizeApplicationForEmployer(docToApplication(updated)),
  };
}

export async function getMyApplicationsHandler(): Promise<{
  ok: true;
  applications: StoredApplication[];
}> {
  const user = await getSessionUser();
  if (!user) return { ok: true, applications: [] };

  if (isMongoConfigured()) {
    try {
      const mongo = await getMongoDb();
      const docs = await mongo
        .collection("job_applications")
        .find({ candidateId: user.id })
        .sort({ createdAt: -1 })
        .toArray();
      return {
        ok: true,
        applications: docs.map((d) => docToApplication(d as Record<string, unknown>)),
      };
    } catch (err) {
      console.warn("MongoDB getMyApplications error:", err);
    }
  }

  await ensureSqliteTables();
  const db = await getDatabase();
  const rows = db
    .prepare("SELECT * FROM job_applications WHERE candidate_id = ? ORDER BY created_at DESC")
    .all(user.id) as Record<string, unknown>[];
  return { ok: true, applications: rows.map(docToApplication) };
}

// ---------------------------------------------------------------------------
// Email Notifications
// ---------------------------------------------------------------------------

async function sendApplicationNotification(
  jobDoc: Record<string, unknown>,
  app: StoredApplication,
): Promise<void> {
  try {
    // Find the employer's email
    const employerId = String(jobDoc["employerId"] || jobDoc["employer_id"]);
    let employerEmail: string | null = null;

    if (isMongoConfigured()) {
      try {
        const mongo = await getMongoDb();
        let empDoc = null;
        try {
          empDoc = await mongo.collection("users").findOne({ _id: new ObjectId(employerId) });
        } catch {
          empDoc = await mongo.collection("users").findOne({ id: employerId });
        }
        if (empDoc) employerEmail = String(empDoc["email"]);
      } catch {
        // fall through
      }
    }

    if (!employerEmail) {
      const db = await getDatabase();
      const empRow = db.prepare("SELECT email FROM users WHERE id = ?").get(employerId) as
        { email: string } | undefined;
      if (empRow) employerEmail = empRow.email;
    }

    if (!employerEmail) return;

    const jobTitle = String(jobDoc["title"]);
    const company = String(jobDoc["company"]);
    const subject = `New application for ${jobTitle} at ${company} — AccessPath`;
    const text = `Hello,

A candidate has applied to your job posting "${jobTitle}" at ${company} on AccessPath.

Candidate: ${app.candidateName}
Applied: ${app.createdAt}

Sign in to the AccessPath Employer Portal to review this application.

— AccessPath`;

    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1c1917;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">New application received</h2>
        <p style="font-size: 15px; line-height: 1.5;">A candidate has applied to your job posting <strong>"${jobTitle}"</strong> at <strong>${company}</strong>.</p>
        <div style="margin: 16px 0; padding: 16px; background: #f5f5f4; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px;"><strong>Candidate:</strong> ${app.candidateName}</p>
          <p style="margin: 4px 0 0; font-size: 14px;"><strong>Applied:</strong> ${app.createdAt}</p>
        </div>
        <p style="font-size: 13px; color: #78716c;">Sign in to the AccessPath Employer Portal to review this application.</p>
      </div>
    `;

    await sendEmail({ to: employerEmail, subject, html, text });
  } catch (err) {
    console.warn("Failed to send application notification:", err);
  }
}
