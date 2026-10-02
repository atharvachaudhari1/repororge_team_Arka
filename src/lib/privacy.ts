import { prefLabels } from "./accessibility";
import type { Profile } from "./app-state";

/** How a field's visibility is decided. */
export type PrivacyMode = "toggle" | "always" | "on-apply" | "never";

export type PrivacyRow = {
  key: string;
  label: string;
  value: string;
  mode: PrivacyMode;
  /** Toggle rows map onto a boolean profile field. */
  field?: "shareDisplayName" | "shareLegalName" | "sharePronouns"
    | "shareAccessibilityWithEmployers" | "shareAccommodationsByDefault";
  help: string;
};

export function privacyRows(profile: Profile): PrivacyRow[] {
  const prefs = prefLabels(profile.accessibilityPreferences);
  return [
    {
      key: "displayName",
      label: "Preferred name",
      value: profile.displayName || profile.name || "Not added yet",
      mode: "toggle",
      field: "shareDisplayName",
      help: "The name employers use to address you.",
    },
    {
      key: "legalName",
      label: "Legal name",
      value: profile.legalName || "Not added",
      mode: "toggle",
      field: "shareLegalName",
      help: "Private by default. Only needed for payroll or background checks after an offer.",
    },
    {
      key: "pronouns",
      label: "Pronouns",
      value: profile.pronouns || "Not added",
      mode: "toggle",
      field: "sharePronouns",
      help: "Optional. Never used in matching or ranking.",
    },
    {
      key: "gender",
      label: "Gender identity",
      value: "Not collected by AccessPath",
      mode: "never",
      help: "AccessPath never asks for or stores gender identity, and never shares it.",
    },
    {
      key: "access",
      label: "Accessibility preferences",
      value: prefs.length ? prefs.join(", ") : "None added",
      mode: "toggle",
      field: "shareAccessibilityWithEmployers",
      help: "Private by default. Used only to show you how well a workplace fits how you work.",
    },
    {
      key: "interview",
      label: "Interview preferences",
      value: profile.shareAccommodationsByDefault
        ? "Included in new applications by default"
        : "Chosen per application",
      mode: "toggle",
      field: "shareAccommodationsByDefault",
      help: "Requests such as captioning or extra time. You can still change this on any application.",
    },
    {
      key: "career",
      label: "Career profile",
      value: [profile.headline, profile.skills.slice(0, 4).join(", ")].filter(Boolean).join(" — ")
        || "Not added yet",
      mode: "always",
      help: "Headline, skills, education and experience. This is what you are assessed on.",
    },
    {
      key: "resume",
      label: "Resume",
      value: profile.resumeName || (profile.resumeText ? "Pasted resume text" : "Not added"),
      mode: "on-apply",
      help: "Sent only to employers you apply to.",
    },
  ];
}

export function isShared(row: PrivacyRow, profile: Profile): boolean {
  if (row.mode === "never") return false;
  if (row.mode === "always" || row.mode === "on-apply") return true;
  return row.field ? Boolean(profile[row.field]) : false;
}

export type PrivacyPreview = {
  shared: { label: string; value: string }[];
  hidden: { label: string; reason: string }[];
};

/** Exactly what an employer receiving an application can see right now. */
export function privacyPreview(profile: Profile): PrivacyPreview {
  const rows = privacyRows(profile);
  const shared: PrivacyPreview["shared"] = [];
  const hidden: PrivacyPreview["hidden"] = [];
  for (const row of rows) {
    if (isShared(row, profile)) shared.push({ label: row.label, value: row.value });
    else
      hidden.push({
        label: row.label,
        reason: row.mode === "never" ? "Never collected or shared" : "Set to private by you",
      });
  }
  return { shared, hidden };
}