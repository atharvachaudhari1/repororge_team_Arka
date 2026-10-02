import { ACCESS_FEATURES, INCLUSION_FEATURES, type Job } from "./jobs-data";

/**
 * Builds an ordered, spoken-word script for a job. Navigation, decorative text
 * and repeated UI labels are deliberately excluded so listening is faster than
 * having a screen reader read the whole page.
 */
export type SpokenSection = { heading: string; text: string };

export function jobSpeechSections(job: Job): SpokenSection[] {
  const sections: SpokenSection[] = [
    { heading: "Job title", text: job.title },
    { heading: "Company", text: job.company },
    { heading: "Location", text: `${job.city}, ${job.workMode} work` },
    { heading: "Salary", text: job.salary ? job.salary.replace("₹", "rupees ") : "Not disclosed by the employer" },
    { heading: "Work mode and type", text: `${job.workMode}, ${job.employment}, ${job.experience} experience` },
    { heading: "About the role", text: job.about },
    { heading: "Responsibilities", text: job.responsibilities.join(". ") },
    { heading: "Required skills", text: job.requiredSkills.join(", ") },
    { heading: "Preferred skills", text: job.preferredSkills.join(", ") },
    {
      heading: "Accessibility information",
      text: `${job.accessSource}. ${job.access.map((a) => ACCESS_FEATURES[a]).join(", ") || "No accessibility features listed"}`,
    },
    {
      heading: "Inclusion information",
      text: job.inclusion.map((i) => INCLUSION_FEATURES[i]).join(", ") || "Not specified",
    },
    {
      heading: "How to apply",
      text:
        "Use the Apply button on this page. You can optionally request interview preferences during the application, and you never need to disclose disability or gender identity.",
    },
  ];
  return sections;
}

export function jobSpeechScript(job: Job) {
  return jobSpeechSections(job)
    .map((s) => `${s.heading}. ${s.text}.`)
    .join(" ");
}
