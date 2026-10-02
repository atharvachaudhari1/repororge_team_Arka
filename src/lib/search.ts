import { JOBS, type Job } from "./jobs-data";
import type { Profile } from "./app-state";

export type Filters = {
  q: string;
  workModes: string[];
  cities: string[];
  employment: string[];
  experience: string[];
  access: string[];
  inclusion: string[];
};

export const EMPTY_FILTERS: Filters = {
  q: "", workModes: [], cities: [], employment: [], experience: [], access: [], inclusion: [],
};

function haystack(j: Job) {
  return [j.title, j.company, j.city, j.workMode, j.category, ...j.requiredSkills, ...j.preferredSkills]
    .join(" ")
    .toLowerCase();
}

export function filterJobs(f: Filters, jobs: Job[] = JOBS) {
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return jobs.filter((j) => {
    const h = haystack(j);
    if (terms.length && !terms.every((t) => h.includes(t))) return false;
    if (f.workModes.length && !f.workModes.includes(j.workMode)) return false;
    if (f.cities.length && !f.cities.includes(j.city)) return false;
    if (f.employment.length && !f.employment.includes(j.employment)) return false;
    if (f.experience.length && !f.experience.includes(j.experience)) return false;
    if (f.access.length && !f.access.every((a) => (j.access as string[]).includes(a))) return false;
    if (f.inclusion.length && !f.inclusion.every((i) => (j.inclusion as string[]).includes(i)))
      return false;
    return true;
  });
}

export function recommendJobs(profile: Profile, limit = 6) {
  const skills = profile.skills.map((s) => s.toLowerCase());
  const scored = JOBS.map((j) => {
    let score = 0;
    const jobSkills = [...j.requiredSkills, ...j.preferredSkills].map((s) => s.toLowerCase());
    score += skills.filter((s) => jobSkills.some((js) => js.includes(s) || s.includes(js))).length * 3;
    if (profile.workPreference && profile.workPreference === j.workMode) score += 2;
    if (
      profile.preferredLocation &&
      j.city.toLowerCase().includes(profile.preferredLocation.toLowerCase().trim())
    )
      score += 2;
    if (profile.headline && j.title.toLowerCase().split(" ").some((w) => w.length > 3 && profile.headline.toLowerCase().includes(w)))
      score += 2;
    return { job: j, score };
  });
  const any = scored.some((s) => s.score > 0);
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ ...s, matched: any }));
}
