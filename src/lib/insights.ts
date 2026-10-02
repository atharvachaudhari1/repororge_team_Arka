import type { Feedback, FeedbackCategory } from "./app-state";
import { FEEDBACK_CATEGORIES } from "./app-state";

export type InsightRow = { key: FeedbackCategory; label: string; average: number; count: number };

export type EmployerInsights = {
  rows: InsightRow[];
  responses: number;
  /** True when the numbers come from labelled demo submissions only. */
  demo: boolean;
  enough: boolean;
};

/** Minimum submissions before any aggregate is shown, to protect anonymity. */
export const MIN_RESPONSES = 3;

/** Clearly-labelled demo feedback so the aggregate view can be shown in a demo. */
const DEMO: Record<string, { responses: number; ratings: Record<FeedbackCategory, number> }> = {
  "TechNova India": {
    responses: 6,
    ratings: { application: 4, interview: 5, communication: 4, assessment: 4 },
  },
  "Kaveri Analytics": {
    responses: 5,
    ratings: { application: 4, interview: 4, communication: 5, assessment: 4 },
  },
  "Indus Digital Labs": {
    responses: 4,
    ratings: { application: 5, interview: 4, communication: 4, assessment: 3 },
  },
};

export function employerInsights(company: string, feedback: Feedback[]): EmployerInsights {
  const mine = feedback.filter((f) => f.company === company);
  if (mine.length >= MIN_RESPONSES) {
    const rows = FEEDBACK_CATEGORIES.map(({ key, label }) => {
      const values = mine.map((f) => f.ratings[key]).filter((v): v is number => Boolean(v));
      const average = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
      return { key, label, average, count: values.length };
    });
    return { rows, responses: mine.length, demo: false, enough: true };
  }

  const demo = DEMO[company];
  if (demo) {
    return {
      rows: FEEDBACK_CATEGORIES.map(({ key, label }) => ({
        key,
        label,
        average: demo.ratings[key],
        count: demo.responses,
      })),
      responses: demo.responses,
      demo: true,
      enough: true,
    };
  }

  return { rows: [], responses: mine.length, demo: false, enough: false };
}