import { EMPTY_FILTERS, type Filters } from "./search";
import { ACCESS_FEATURES } from "./jobs-data";

export type QueryChip = {
  type: "text" | "workMode" | "city" | "access" | "employment";
  label: string;
  value: string;
};

export type VoiceQueryResult = {
  filters: Filters;
  chips: QueryChip[];
};

const CITY_SYNONYMS: Record<string, string> = {
  bengaluru: "Bengaluru",
  bangalore: "Bengaluru",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  delhi: "Delhi-NCR",
  ncr: "Delhi-NCR",
  gurgaon: "Delhi-NCR",
  noida: "Delhi-NCR",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  madras: "Chennai",
  pune: "Pune",
};

const WORK_MODE_SYNONYMS: Record<string, string> = {
  remote: "Remote",
  "work from home": "Remote",
  wfh: "Remote",
  hybrid: "Hybrid",
  "on site": "On-site",
  onsite: "On-site",
  office: "On-site",
};

const ACCESS_SYNONYMS: Record<string, keyof typeof ACCESS_FEATURES> = {
  "screen reader": "screen_reader",
  "screen readers": "screen_reader",
  "wheelchair": "step_free_access",
  "step free": "step_free_access",
  "ramp": "step_free_access",
  "accessible washroom": "accessible_washrooms",
  "washrooms": "accessible_washrooms",
  "sign language": "sign_interpreter",
  "interpreter": "sign_interpreter",
  "caption": "captioned_meetings",
  "captions": "captioned_meetings",
  "flexible hours": "flexible_hours",
  "flexible time": "flexible_hours",
  "quiet workspace": "quiet_workspace",
  "quiet room": "quiet_workspace",
};

/**
 * Parses a spoken natural language job search query into structured search filters and visual chips.
 */
export function parseVoiceQuery(utterance: string): VoiceQueryResult {
  const filters: Filters = { ...EMPTY_FILTERS };
  const chips: QueryChip[] = [];
  let remaining = utterance.toLowerCase();

  // Strip conversational prefixes
  remaining = remaining
    .replace(/^(search for|find me a job for|find jobs for|show me|jobs for|look for|i am looking for)\s+/i, "")
    .trim();

  // 1. Detect Work Mode
  for (const [key, val] of Object.entries(WORK_MODE_SYNONYMS)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(remaining)) {
      if (!filters.workModes.includes(val)) {
        filters.workModes.push(val);
        chips.push({ type: "workMode", label: val, value: val });
      }
      remaining = remaining.replace(new RegExp(`\\b${key}\\b`, "gi"), " ");
    }
  }

  // 2. Detect Cities
  for (const [key, val] of Object.entries(CITY_SYNONYMS)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(remaining)) {
      if (!filters.cities.includes(val)) {
        filters.cities.push(val);
        chips.push({ type: "city", label: val, value: val });
      }
      remaining = remaining.replace(new RegExp(`\\b${key}\\b`, "gi"), " ");
    }
  }

  // 3. Detect Accessibility Accommodations
  for (const [phrase, featureKey] of Object.entries(ACCESS_SYNONYMS)) {
    if (remaining.includes(phrase)) {
      if (!filters.access.includes(featureKey)) {
        filters.access.push(featureKey);
        chips.push({
          type: "access",
          label: ACCESS_FEATURES[featureKey] || featureKey,
          value: featureKey,
        });
      }
      remaining = remaining.replace(phrase, " ");
    }
  }

  // 4. Remaining keywords clean up
  const cleanQ = remaining
    .replace(/\b(in|with|for|and|at|the|a|an|jobs|positions|roles)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanQ) {
    filters.q = cleanQ;
    chips.push({ type: "text", label: `"${cleanQ}"`, value: cleanQ });
  }

  return { filters, chips };
}
