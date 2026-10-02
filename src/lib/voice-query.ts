import { ACCESS_FEATURES, CITIES, INCLUSION_FEATURES } from "./jobs-data";
import { EMPTY_FILTERS, type Filters } from "./search";

/** A single interpreted piece of a spoken query, shown as an editable chip. */
export type QueryChip = { group: keyof Filters; value: string; label: string };

const MODE_WORDS: [string[], string][] = [
  [["remote", "work from home", "from home", "wfh"], "Remote"],
  [["hybrid"], "Hybrid"],
  [["on site", "onsite", "on-site", "in office", "office based"], "On-site"],
];

const EXPERIENCE_WORDS: [string[], string][] = [
  [["fresher", "freshers", "entry level", "graduate", "no experience"], "Fresher"],
  [["junior", "0 to 2", "0-2", "one year", "two years"], "0-2 years"],
  [["mid level", "2 to 5", "2-5", "three years", "four years"], "2-5 years"],
  [["senior", "lead", "5 plus", "5+", "experienced"], "5+ years"],
];

const EMPLOYMENT_WORDS: [string[], string][] = [
  [["full time", "full-time"], "Full-time"],
  [["part time", "part-time"], "Part-time"],
  [["internship", "intern"], "Internship"],
  [["contract", "freelance"], "Contract"],
];

const ACCESS_WORDS: [string[], keyof typeof ACCESS_FEATURES][] = [
  [["accessible interview", "interview accessible", "accessible interviews"], "accessible_interview"],
  [["screen reader", "screenreader", "nvda", "jaws", "talkback"], "screen_reader"],
  [["flexible hours", "flexible working", "flexible schedule", "flexible timing", "flexible work"], "flexible_work"],
  [["caption", "captions", "captioned", "subtitles"], "captioned_meetings"],
  [["assistive technology", "assistive tech", "braille", "magnifier"], "assistive_tech"],
  [["keyboard"], "keyboard_friendly"],
  [["accessible application", "accessible website", "accessible apply"], "accessible_application"],
  [["accessible workplace", "accessible office", "step free", "wheelchair"], "accessible_workplace"],
];

const INCLUSION_WORDS: [string[], keyof typeof INCLUSION_FEATURES][] = [
  [["lgbtq", "lgbt", "queer friendly", "transgender friendly", "trans friendly"], "lgbtq_policy"],
  [["gender neutral", "gender-neutral"], "gender_neutral_facilities"],
  [["equal opportunity"], "equal_opportunity"],
  [["inclusive hiring", "inclusive hiring program"], "inclusive_hiring"],
];

const FILLER =
  /\b(find|search|show|me|please|for|with|that|have|has|the|a|an|and|jobs?|job|roles?|openings?|opening|vacancy|vacancies|in|at|near|around|any|available|hiring|looking|want|need|i|my)\b/g;

/** Converts a spoken sentence into structured filters plus a free-text remainder. */
export function parseVoiceQuery(text: string): { filters: Filters; chips: QueryChip[] } {
  const raw = ` ${text.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ")} `;
  let rest = raw;
  const filters: Filters = { ...EMPTY_FILTERS, workModes: [], cities: [], employment: [], experience: [], access: [], inclusion: [] };
  const chips: QueryChip[] = [];

  const take = (phrases: string[]) => {
    let hit = false;
    for (const p of phrases) {
      if (rest.includes(` ${p} `) || rest.includes(`${p} `) || rest.includes(p)) {
        if (!rest.includes(p)) continue;
        hit = true;
        rest = rest.split(p).join(" ");
      }
    }
    return hit;
  };

  for (const [words, value] of MODE_WORDS)
    if (take(words) && !filters.workModes.includes(value)) {
      filters.workModes.push(value);
      chips.push({ group: "workModes", value, label: value });
    }
  for (const [words, value] of EXPERIENCE_WORDS)
    if (take(words) && !filters.experience.includes(value)) {
      filters.experience.push(value);
      chips.push({ group: "experience", value, label: value });
    }
  for (const [words, value] of EMPLOYMENT_WORDS)
    if (take(words) && !filters.employment.includes(value)) {
      filters.employment.push(value);
      chips.push({ group: "employment", value, label: value });
    }
  for (const [words, key] of ACCESS_WORDS)
    if (take(words) && !filters.access.includes(key)) {
      filters.access.push(key);
      chips.push({ group: "access", value: key, label: ACCESS_FEATURES[key] });
    }
  for (const [words, key] of INCLUSION_WORDS)
    if (take(words) && !filters.inclusion.includes(key)) {
      filters.inclusion.push(key);
      chips.push({ group: "inclusion", value: key, label: INCLUSION_FEATURES[key] });
    }
  for (const city of CITIES) {
    const name = city.replace(" (India)", "").toLowerCase();
    if (name === "remote") continue;
    if (rest.includes(name)) {
      rest = rest.split(name).join(" ");
      filters.cities.push(city);
      chips.push({ group: "cities", value: city, label: city });
    }
  }

  const q = rest.replace(FILLER, " ").replace(/\s+/g, " ").trim();
  filters.q = q;
  if (q) chips.push({ group: "q", value: q, label: q });
  return { filters, chips };
}

export function describeFilters(filters: Filters) {
  const parts: string[] = [];
  if (filters.q) parts.push(filters.q);
  parts.push(...filters.workModes, ...filters.cities, ...filters.experience, ...filters.employment);
  parts.push(...filters.access.map((a) => ACCESS_FEATURES[a as keyof typeof ACCESS_FEATURES] ?? a));
  parts.push(...filters.inclusion.map((i) => INCLUSION_FEATURES[i as keyof typeof INCLUSION_FEATURES] ?? i));
  return parts;
}
