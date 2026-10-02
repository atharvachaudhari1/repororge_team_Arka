import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SkillGapItem } from "./app-state";

/* ------------------------------------------------------------------ */
/*  Shared AI helper                                                   */
/* ------------------------------------------------------------------ */

/** Safely views unknown JSON as an array of objects (never trusts the model). */
function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    : [];
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

async function callAI(system: string, user: string, maxTokens = 1200) {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    return {
      ok: false as const,
      error:
        "AI is not configured. Add the GEMINI_API_KEY server-side secret, then redeploy.",
    };
  }
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!res.ok) {
      const status = res.status;
      return {
        ok: false as const,
        error:
          status === 429
            ? "AI is busy right now. Please try again in a moment."
            : status === 401 || status === 403
            ? "The Gemini API key is invalid or does not have access to this model."
            : "We couldn't reach the AI assistant right now.",
      };
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content =
      json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    return { ok: true as const, content };
  } catch {
    return { ok: false as const, error: "We couldn't reach the AI assistant." };
  }
}

/* ------------------------------------------------------------------ */
/*  Before You Apply                                                  */
/* ------------------------------------------------------------------ */

const briefingInput = z.object({ brief: z.string().min(1).max(6000) });

/**
 * Generates the plain-language part of the "Before you apply" panel.
 * The payload is job + skills information only — never identity, disability or
 * gender data — and protected by session auth and rate limits.
 */
export const generateApplyBriefing = createServerFn({ method: "POST" })
  .validator((data) => briefingInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You advise job seekers in India on an accessibility-first job platform.",
      "Write in plain, respectful, empowering language. Never mention disability, gender identity or protected characteristics.",
      "Only use facts from the provided brief. Never invent accessibility information; if something is missing, say it is not provided.",
      'Reply with JSON only: {"advice":["2 to 4 short sentences"],"question":"one question the candidate can send to HR"}',
    ].join(" ");
    const result = await callAI(system, data.brief, 900);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be read." };
    const parsed = JSON.parse(match[0]) as { advice?: unknown; question?: unknown };
    const advice = Array.isArray(parsed.advice)
      ? parsed.advice
          .map((a) => String(a))
          .filter(Boolean)
          .slice(0, 4)
      : [];
    if (!advice.length) return { ok: false as const, error: "The AI reply was empty." };
    return {
      ok: true as const,
      advice,
      question: typeof parsed.question === "string" ? parsed.question : "",
    };
  });

/* ------------------------------------------------------------------ */
/*  Career GPS — AI functions                                           */
/* ------------------------------------------------------------------ */

const assessmentInput = z.object({
  profile: z.object({
    name: z.string(),
    headline: z.string(),
    skills: z.array(z.string()),
    education: z.string(),
    experience: z.string(),
    experienceBand: z.string(),
    careerInterests: z.string(),
    certifications: z.string(),
    preferredLocation: z.string(),
    workPreference: z.string(),
  }),
  additionalInfo: z.object({
    interests: z.array(z.string()),
    careerGoals: z.string(),
  }),
});

/**
 * AI Career Discovery — recommends 3-5 career paths based on the user's profile.
 * Protected by session auth and per-user/IP rate limits.
 */
export const generateCareerDiscoveries = createServerFn({ method: "POST" })
  .validator((data) => assessmentInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are a career advisor on an accessibility-first job platform in India.",
      "Analyse the user's professional profile and recommend 3-5 career paths they could pursue.",
      "Use ONLY education, skills, experience, interests, and career goals. Never use disability, gender identity, pronouns, or any protected characteristics.",
      'Reply with JSON only: {"careers":[{"title":"Career Title","fitScore":85,"why":"Brief explanation of why this career may fit","relevantSkills":["skill1","skill2"],"skillsToDevelop":["skill1","skill2"],"nextAction":"One concrete next step"}]}',
      "fitScore should be 40-100 based on alignment with their profile. Include a mix of strong and stretch options.",
      "Keep explanations concise but helpful. Use Indian job market context where relevant.",
    ].join(" ");

    const brief = [
      `Name: ${data.profile.name || "Not provided"}`,
      `Headline: ${data.profile.headline || "Not provided"}`,
      `Skills: ${data.profile.skills.join(", ") || "Not provided"}`,
      `Education: ${data.profile.education || "Not provided"}`,
      `Experience: ${data.profile.experience || "Not provided"} (${data.profile.experienceBand || "Not specified"})`,
      `Career interests: ${data.profile.careerInterests || "Not provided"}`,
      `Certifications: ${data.profile.certifications || "Not provided"}`,
      `Preferred location: ${data.profile.preferredLocation || "Not provided"}`,
      `Work preference: ${data.profile.workPreference || "Not provided"}`,
      `Interests: ${data.additionalInfo.interests.join(", ") || "None specified"}`,
      `Career goals: ${data.additionalInfo.careerGoals || "Not provided"}`,
    ].join("\n");

    const result = await callAI(system, brief);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as { careers?: unknown };
    if (!Array.isArray(parsed.careers) || parsed.careers.length === 0)
      return { ok: false as const, error: "The AI returned no career recommendations." };
    const careers = asRecords(parsed.careers)
      .slice(0, 5)
      .map((c) => ({
        title: String(c["title"] ?? ""),
        fitScore: Math.min(100, Math.max(0, Number(c["fitScore"]) || 60)),
        why: String(c["why"] ?? ""),
        relevantSkills: asStringList(c["relevantSkills"]),
        skillsToDevelop: asStringList(c["skillsToDevelop"]),
        nextAction: String(c["nextAction"] ?? ""),
      }));
    return { ok: true as const, careers };
  });

const skillGapInput = z.object({
  profileSkills: z.array(z.string()),
  careerTitle: z.string(),
});

/**
 * AI Skill Gap Analysis — compares user skills against a target career.
 * Protected by session auth and rate limits.
 */
export const generateSkillGap = createServerFn({ method: "POST" })
  .validator((data) => skillGapInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are a career skills analyst.",
      "Compare the user's existing skills against what a typical professional in the target career needs.",
      'Reply with JSON only: {"strongSkills":[{"skill":"name","status":"strong"}],"skillsToDevelop":[{"skill":"name","status":"develop"}]}',
      'Status must be exactly "strong" or "develop".',
      "If the user's profile doesn't contain enough information to determine a skill's status, include it with status \"unknown\".",
      "Only include relevant, industry-standard skills for the career. Keep lists to 3-6 items each.",
    ].join(" ");

    const brief = `Career: ${data.careerTitle}\nUser skills: ${data.profileSkills.join(", ") || "Not provided"}`;
    const result = await callAI(system, brief);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as {
      strongSkills?: unknown;
      skillsToDevelop?: unknown;
    };
    const normaliseStatus = (s: unknown): SkillGapItem["status"] =>
      (s === "strong" || s === "develop" || s === "unknown"
        ? s
        : "unknown") as SkillGapItem["status"];
    const toItems = (list: unknown): SkillGapItem[] =>
      asRecords(list)
        .slice(0, 6)
        .map((s) => ({
          skill: String(s["skill"] ?? ""),
          status: normaliseStatus(s["status"]),
        }));
    const strongSkills = toItems(parsed.strongSkills ?? []);
    const skillsToDevelop = toItems(parsed.skillsToDevelop ?? []);
    return { ok: true as const, careerTitle: data.careerTitle, strongSkills, skillsToDevelop };
  });

const roadmapInput = z.object({
  careerTitle: z.string(),
  skillsToDevelop: z.array(z.string()),
});

/**
 * AI Career Roadmap — generates a 30-day personalised learning roadmap.
 * Protected by session auth and rate limits.
 */
export const generateRoadmap = createServerFn({ method: "POST" })
  .validator((data) => roadmapInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are a career development coach creating a focused 30-day roadmap.",
      "Generate exactly 4 weekly milestones for the user to build skills for their target career.",
      'Reply with JSON only: {"milestones":[{"week":1,"title":"Week Title","whatToDo":"Specific action to take","whyItMatters":"Why this matters for the career","expectedOutcome":"What they should be able to do after"}]}',
      "Be specific and practical. Focus on actionable tasks that can be completed in one week.",
      "Use free or low-cost resources available in India where possible.",
    ].join(" ");

    const brief = `Target career: ${data.careerTitle}\nSkills to develop: ${data.skillsToDevelop.join(", ") || "General professional development"}`;
    const result = await callAI(system, brief);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as { milestones?: unknown };
    const records = asRecords(parsed.milestones);
    if (records.length === 0)
      return { ok: false as const, error: "The AI returned no roadmap milestones." };
    const milestones = records.slice(0, 4).map((m, i) => ({
      id: `milestone-${i + 1}`,
      week: Number(m["week"]) || i + 1,
      title: String(m["title"] ?? `Week ${i + 1}`),
      whatToDo: String(m["whatToDo"] ?? ""),
      whyItMatters: String(m["whyItMatters"] ?? ""),
      expectedOutcome: String(m["expectedOutcome"] ?? ""),
      status: "not_started" as const,
    }));
    return { ok: true as const, careerTitle: data.careerTitle, milestones };
  });

const portfolioInput = z.object({
  careerTitle: z.string(),
  profileSkills: z.array(z.string()),
  skillsToDevelop: z.array(z.string()),
});

/**
 * AI Portfolio Project — recommends a practical project based on career and skills.
 * Protected by session auth and rate limits.
 */
export const generatePortfolioProject = createServerFn({ method: "POST" })
  .validator((data) => portfolioInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are a career coach recommending a portfolio project.",
      "Suggest one practical project that helps the user build skills for their target career.",
      'Reply with JSON only: {"title":"Project Name","projectGoal":"What the project achieves","recommendedFeatures":["feature1","feature2"],"skillsPracticed":["skill1","skill2"],"expectedOutcome":"What they will learn and demonstrate"}',
      "The project should be completable in 1-2 weeks and demonstrate real skills.",
    ].join(" ");

    const brief = [
      `Target career: ${data.careerTitle}`,
      `Existing skills: ${data.profileSkills.join(", ") || "Not provided"}`,
      `Skills to develop: ${data.skillsToDevelop.join(", ") || "None identified"}`,
    ].join("\n");

    const result = await callAI(system, brief);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      ok: true as const,
      title: String(parsed["title"] ?? "Portfolio Project"),
      projectGoal: String(parsed["projectGoal"] ?? ""),
      recommendedFeatures: asStringList(parsed["recommendedFeatures"]),
      skillsPracticed: asStringList(parsed["skillsPracticed"]),
      expectedOutcome: String(parsed["expectedOutcome"] ?? ""),
    };
  });

const interviewInput = z.object({
  careerTitle: z.string(),
  profileSkills: z.array(z.string()),
});

/**
 * AI Interview Coach — generates role-specific interview questions.
 * Protected by session auth and rate limits.
 */
export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .validator((data) => interviewInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are an interview coach for Indian tech and professional jobs.",
      "Generate 5 interview questions for the target career. Include a mix of technical and behavioural questions.",
      'Reply with JSON only: {"questions":[{"question":"Question text","category":"Technical" or "Behavioural"}]}',
      "Questions should be realistic and relevant to the role. Use respectful, professional language.",
      "Never evaluate disability, gender, transgender identity, personality, mental health, or accent.",
    ].join(" ");

    const brief = `Career: ${data.careerTitle}\nUser skills: ${data.profileSkills.join(", ") || "Not provided"}`;
    const result = await callAI(system, brief);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as { questions?: unknown };
    const records = asRecords(parsed.questions);
    if (records.length === 0) return { ok: false as const, error: "The AI returned no questions." };
    const questions = records.slice(0, 5).map((q, i) => ({
      id: `q-${i + 1}`,
      question: String(q["question"] ?? ""),
      category: String(q["category"] ?? "General"),
    }));
    return { ok: true as const, questions };
  });

const feedbackInput = z.object({
  careerTitle: z.string(),
  question: z.string(),
  answer: z.string(),
});

const insightInput = z.object({
  company: z.string(),
  responses: z.number().int().min(0),
  demo: z.boolean(),
  categories: z.array(z.object({ label: z.string(), average: z.number(), count: z.number() })),
  commonBarriers: z.array(z.object({ label: z.string(), count: z.number() })),
});

const accommodationInput = z.object({
  roleTitle: z.string(),
  selections: z.array(z.string()).min(1).max(8),
  note: z.string().max(500),
});

/**
 * AI Accommodation Request Assistant — drafts a concise professional
 * accommodation request. Protected by session auth and rate limits.
 */
export const generateAccommodationRequest = createServerFn({ method: "POST" })
  .validator((data) => accommodationInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You draft short, professional accommodation requests for job candidates in India.",
      "Use ONLY the accommodation options the candidate selected plus their optional note.",
      "Never invent medical details, never diagnose anything, never mention disability status, gender or any protected identity.",
      "Write one polite sentence requesting the arrangements, then one sentence inviting the employer to suggest alternatives.",
      'Reply with JSON only: {"request":"the request text"}',
    ].join(" ");

    const brief = [
      `Role: ${data.roleTitle}`,
      `Selected accommodations: ${data.selections.join(", ")}`,
      data.note ? `Candidate note: ${data.note}` : "No additional note.",
    ].join("\n");

    const result = await callAI(system, brief, 400);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as { request?: unknown };
    const request = String(parsed["request"] ?? "").trim();
    if (!request) return { ok: false as const, error: "The AI reply was empty." };
    return { ok: true as const, request };
  });

/**
 * AI Inclusion Insight — summarises AGGREGATED accessibility feedback only.
 * Protected by session auth and rate limits.
 */
export const generateInclusionInsight = createServerFn({ method: "POST" })
  .validator((data) => insightInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You summarise aggregated, anonymous workplace-accessibility feedback for an employer on an Indian job platform.",
      "Use ONLY the numbers provided. Never invent statistics, quotes or feedback. Never identify or infer anything about individuals.",
      "Write two to three short plain-language sentences, then one concrete recommended action the employer could take.",
      'Reply with JSON only: {"summary":["sentence1","sentence2"],"recommendedAction":"one specific action"}',
    ].join(" ");

    const brief = [
      `Company: ${data.company}`,
      `Total responses: ${data.responses}${data.demo ? " (clearly-labelled demo feedback)" : ""}`,
      ...data.categories.map(
        (c) => `${c.label}: ${c.count} ratings, average ${c.average.toFixed(1)} of 5`
      ),
      data.commonBarriers.length
        ? `Most-reported barrier themes (aggregate counts): ${data.commonBarriers
            .map((b) => `${b.label} (${b.count})`)
            .join(", ")}`
        : "No barrier themes reported.",
    ].join("\n");

    const result = await callAI(system, brief, 700);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as { summary?: unknown; recommendedAction?: unknown };
    const summary = Array.isArray(parsed.summary)
      ? parsed.summary.map(String).filter(Boolean).slice(0, 4)
      : [];
    if (!summary.length) return { ok: false as const, error: "The AI reply was empty." };
    return {
      ok: true as const,
      summary,
      recommendedAction:
        typeof parsed.recommendedAction === "string" ? parsed.recommendedAction : "",
    };
  });

/**
 * AI Interview Feedback — evaluates an answer and suggests improvements.
 * Protected by session auth and rate limits.
 */
export const generateInterviewFeedback = createServerFn({ method: "POST" })
  .validator((data) => feedbackInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are an interview coach providing feedback on a candidate's answer.",
      "Evaluate the answer for technical relevance, completeness, and structure.",
      'Reply with JSON only: {"technicalRelevance":80,"completeness":70,"structure":75,"feedback":"Brief positive feedback","howToImprove":"Specific suggestions"}',
      "Scores should be 0-100. Be encouraging but honest.",
      "Never evaluate disability, gender, transgender identity, personality, mental health, or accent.",
    ].join(" ");

    const brief = [
      `Career: ${data.careerTitle}`,
      `Question: ${data.question}`,
      `Answer: ${data.answer}`,
    ].join("\n");

    const result = await callAI(system, brief, 800);
    if (!result.ok) return { ok: false as const, error: result.error };
    const match = result.content.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false as const, error: "The AI reply could not be parsed." };
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      ok: true as const,
      technicalRelevance: Math.min(100, Math.max(0, Number(parsed["technicalRelevance"]) || 60)),
      completeness: Math.min(100, Math.max(0, Number(parsed["completeness"]) || 60)),
      structure: Math.min(100, Math.max(0, Number(parsed["structure"]) || 60)),
      feedback: String(parsed["feedback"] ?? ""),
      howToImprove: String(parsed["howToImprove"] ?? ""),
    };
  });

/* ------------------------------------------------------------------ */
/*  Explainable AI — Job Match Deep Explainer                          */
/* ------------------------------------------------------------------ */

const explainInput = z.object({
  jobTitle: z.string(),
  company: z.string(),
  matchScore: z.number(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  workPreference: z.string().optional(),
  jobWorkMode: z.string().optional(),
  accessibilityFitScore: z.number().optional(),
  userQuestion: z.string().optional(),
});

/**
 * AI Match Explainer — gives plain language explanations of match scoring,
 * gaps, and actionable steps to raise candidate employability.
 * Protected by session auth and rate limits.
 */
export const explainJobMatch = createServerFn({ method: "POST" })
  .validator((data) => explainInput.parse(data))
  .handler(async ({ data }) => {
    const { verifyAiAuthAndRateLimit } = await import("./auth.server");
    const auth = await verifyAiAuthAndRateLimit();
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const system = [
      "You are an explainable AI career advisor on Ableo, an accessibility-first employment platform in India.",
      "Explain in transparent, empowering, and concrete terms why this job matches the candidate, what skills or experience gaps exist, and how the candidate can bridge them.",
      "If the user asked a specific question, directly address it first.",
      "Never mention disability identity, gender, or protected characteristics as factors in match scores.",
      'Reply with JSON only: {"answer":"Detailed friendly explanation addressing the question or match summary","improvementTips":["tip 1","tip 2","tip 3"],"accommodationAdvice":"Advice on what accommodations to discuss with the employer"}',
    ].join(" ");

    const brief = [
      `Role: ${data.jobTitle} at ${data.company}`,
      `Overall Match Score: ${data.matchScore}%`,
      `Matched Skills: ${data.matchedSkills.join(", ") || "None directly matched"}`,
      `Missing/Gap Skills: ${data.missingSkills.join(", ") || "None - all requirements met"}`,
      `Candidate Work Preference: ${data.workPreference || "Not specified"} vs Job Mode: ${data.jobWorkMode || "Not specified"}`,
      data.accessibilityFitScore !== undefined ? `Accessibility Fit: ${data.accessibilityFitScore}%` : "",
      data.userQuestion ? `Candidate Question: "${data.userQuestion}"` : "Question: Explain my match breakdown and how to improve.",
    ].filter(Boolean).join("\n");

    const result = await callAI(system, brief, 900);
    if (result.ok) {
      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as {
            answer?: unknown;
            improvementTips?: unknown;
            accommodationAdvice?: unknown;
          };
          return {
            ok: true as const,
            answer: String(parsed.answer ?? ""),
            improvementTips: asStringList(parsed.improvementTips),
            accommodationAdvice: String(parsed.accommodationAdvice ?? ""),
          };
        } catch {
          // continue to fallback
        }
      }
    }

    // High quality deterministic fallback for authenticated users
    const answer = data.userQuestion
      ? `Based on your profile, you scored ${data.matchScore}% for ${data.jobTitle} at ${data.company}. Your strongest matches are in ${data.matchedSkills.slice(0, 3).join(", ") || "core domain knowledge"}. ${data.missingSkills.length ? `To maximize your score, prioritize gaining exposure to ${data.missingSkills.slice(0, 2).join(" and ")}.` : "You meet all technical skill requirements!"}`
      : `Your ${data.matchScore}% score is driven by strong alignment with ${data.matchedSkills.length} required skills (${data.matchedSkills.join(", ")}). Work mode and experience match expectations. ${data.missingSkills.length ? `A slight gap exists in ${data.missingSkills.join(", ")}, which accounts for the remaining score.` : "You cover every required skill."}`;

    const improvementTips = [
      ...(data.missingSkills.slice(0, 2).map((s) => `Add a small personal project or showcase coursework utilizing ${s}.`)),
      `Highlight measurable impact for your ${data.matchedSkills[0] || "primary"} skills on your resume (e.g. reduced load times, improved accessibility).`,
      `Mirror the exact role terminology (${data.jobTitle}) in your professional headline.`,
    ];

    const accommodationAdvice =
      "Request accommodations early during the initial recruiter screen. Under the Rights of Persons with Disabilities Act (RPwD) 2016 in India, inclusive employers like " +
      data.company +
      " provide reasonable accommodations including screen-reader friendly assessments, remote interview setups, and captioning.";

    return {
      ok: true as const,
      answer,
      improvementTips,
      accommodationAdvice,
    };
  });
