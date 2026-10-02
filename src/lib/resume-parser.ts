import type { Profile } from "./app-state";
import type { AccessFeature } from "./jobs-data";

export type ParsedResume = {
  name: string;
  headline: string;
  email: string;
  education: string;
  experience: string;
  experienceBand: Profile["experienceBand"];
  skills: string[];
  careerInterests: string;
  certifications: string;
  preferredLocation: string;
  workPreference: Profile["workPreference"];
  suggestedAccommodations: AccessFeature[];
  rawText: string;
  confidence: number;
};

export const DEMO_RESUMES: {
  id: string;
  label: string;
  role: string;
  disabilityFocus: string;
  parsed: ParsedResume;
}[] = [
  {
    id: "frontend-blind",
    label: "Sample 1: Frontend Engineer (Screen Reader User)",
    role: "Frontend Developer",
    disabilityFocus: "Visual Accessibility / NVDA & JAWS User",
    parsed: {
      name: "Atharva Chaudhari",
      headline: "Frontend Engineer passionate about Accessible Web & Design Systems",
      email: "atharva.dev@example.com",
      education: "B.Tech in Computer Science, Xavier Institute of Engineering (2024)",
      experience:
        "Frontend Engineering Intern at TechVibe (8 mos): Built accessible React + TypeScript UI components meeting WCAG 2.2 AA standards. Integrated ARIA live regions and keyboard navigation patterns.",
      experienceBand: "0-2 years",
      skills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "WAI-ARIA", "Jest", "Git"],
      careerInterests: "Frontend development, web accessibility engineering, inclusive design",
      certifications: "IAAP Web Accessibility Specialist (WAS) Foundation, Meta Frontend Specialization",
      workPreference: "Remote",
      suggestedAccommodations: ["screen_reader", "keyboard_friendly", "remote_work", "accessible_interview", "assistive_tech"],
      rawText: `Atharva Chaudhari
Frontend Engineer | Web Accessibility Advocate
Email: atharva.dev@example.com | Mumbai, India

Summary:
Frontend Engineer with 1+ years experience creating WCAG 2.2 AA compliant web interfaces. Daily user of screen reading assistive technology (NVDA, JAWS). Skilled in React, TypeScript, WAI-ARIA, and modern CSS.

Experience:
Frontend Developer Intern - TechVibe (2023 - 2024)
- Developed accessible components using React, TypeScript and Tailwind CSS.
- Automated keyboard navigation and screen reader audits using axe-core and Jest.
- Improved accessibility compliance score from 74% to 98%.

Education:
B.Tech in Computer Science - Xavier Institute of Engineering (2020 - 2024)

Skills:
React, JavaScript, TypeScript, HTML, CSS, WAI-ARIA, Jest, Git, WCAG 2.2

Accommodations Needed:
Screen reader friendly code assessments, remote interview or accessible venue, assistive technology support.`,
      confidence: 96,
    },
  },
  {
    id: "data-motor",
    label: "Sample 2: Data Analyst (Motor / Mobility Accommodations)",
    role: "Data Analyst",
    disabilityFocus: "Motor / Wheelchair & Speech Dictation",
    parsed: {
      name: "Saanvi Chamoli",
      headline: "Data Analyst specializing in Python, SQL & Accessible Dashboards",
      email: "saanvi.data@example.com",
      education: "B.Sc in Statistics & Data Science, Mumbai University (2023)",
      experience:
        "Junior Data Analyst at MetricFlow (1.5 yrs): Designed automated SQL ETL queries and PowerBI / Tableau dashboards. Analyzed user engagement metrics for inclusive products.",
      experienceBand: "0-2 years",
      skills: ["Python", "SQL", "Tableau", "PowerBI", "Excel", "PostgreSQL", "Pandas", "Statistics"],
      careerInterests: "Business intelligence, healthcare data analytics, predictive modeling",
      certifications: "Google Data Analytics Professional Certificate",
      workPreference: "Hybrid",
      suggestedAccommodations: ["flexible_work", "accessible_workplace", "assistive_tech", "remote_work"],
      rawText: `Saanvi Chamoli
Data Analyst | SQL & Business Intelligence
Email: saanvi.data@example.com | Mumbai, India

Professional Summary:
Analytical and detail-oriented Data Analyst with proficiency in Python, PostgreSQL, PowerBI and Tableau. Experience synthesizing complex datasets into accessible business dashboards.

Experience:
Data Analyst - MetricFlow Solutions (2023 - Present)
- Extracted and cleaned operational data using SQL and Python (Pandas).
- Designed interactive, high-contrast executive dashboards in PowerBI.
- Reduced weekly report generation time by 40% via automated pipelines.

Education:
B.Sc in Statistics & Data Science - Mumbai University

Skills:
Python, SQL, PostgreSQL, Tableau, PowerBI, Excel, Pandas, Statistics

Accommodations & Preferences:
Wheelchair accessible building and elevators for on-site days; flexible scheduling and voice dictation software support.`,
      confidence: 94,
    },
  },
  {
    id: "content-deaf",
    label: "Sample 3: Content Writer (Hearing Accessibility / Captions)",
    role: "Content Writer",
    disabilityFocus: "Deaf / Hard of Hearing, Captioned Meetings",
    parsed: {
      name: "Bhakti Nimaj",
      headline: "Technical Content Writer & Inclusive Communications Specialist",
      email: "bhakti.writes@example.com",
      education: "B.A. in English Literature & Journalism, St. Xavier's College (2023)",
      experience:
        "Content Specialist at MediaSprint (2 yrs): Authored 120+ published articles, SEO-optimized guides, and accessible product documentation with closed captions and transcripts.",
      experienceBand: "0-2 years",
      skills: ["Content Writing", "Copywriting", "SEO", "Technical Writing", "Research", "Editing", "WordPress"],
      careerInterests: "Technical writing, accessible documentation, digital marketing",
      certifications: "HubSpot Content Marketing Certified, Google Digital Garage",
      workPreference: "Remote",
      suggestedAccommodations: ["captioned_meetings", "flexible_work", "remote_work", "accessible_interview"],
      rawText: `Bhakti Nimaj
Technical Content Writer & Communication Specialist
Email: bhakti.writes@example.com

Profile:
Creative and thorough Content Writer with 2 years of experience crafting high-impact technical documentation, blog articles, and accessibility guides. Proficient in SEO best practices and written-first communication.

Experience:
Content Specialist - MediaSprint (2023 - Present)
- Researched and authored 100+ high-ranking articles in tech and accessibility.
- Optimized articles for organic search ranking and read-aloud readability.
- Collaborated seamlessly across remote engineering teams through written channels and live-captioned meetings.

Education:
B.A. in English Literature & Journalism - St. Xavier's College

Skills:
Content Writing, Copywriting, SEO, Technical Writing, Research, Editing, CMS

Work & Communication Preferences:
Remote or hybrid with written communication preference; real-time captions for video meetings.`,
      confidence: 95,
    },
  },
];

/**
 * Intelligent heuristic & regex-based resume parser that runs in the browser.
 * Extracts candidate details, skills, education, and accessibility hints.
 */
export function parseResumeText(rawText: string, fileName?: string): ParsedResume {
  const text = rawText.trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract a real name near the contact header, never a filename, title, or section heading.
  const isName = (line: string) => {
    const value = line.trim();
    const blocked = /\b(cv|resume|ats|curriculum|portfolio|linkedin|github|summary|objective|experience|education|skills|projects?|certifications?)\b/i;
    return value.length <= 60
      && !blocked.test(value)
      && /^[A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3}$/.test(value);
  };
  const emailLine = lines.findIndex((line) => line.includes("@"));
  const headerLines = emailLine >= 0 ? lines.slice(Math.max(0, emailLine - 4), emailLine + 1) : lines.slice(0, 8);
  const name = headerLines.find(isName) ?? lines.find(isName) ?? "";

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Extract Headline
  const nameIndex = name ? lines.indexOf(name) : -1;
  const headline = lines
    .slice(Math.max(0, nameIndex + 1), Math.max(0, nameIndex + 5))
    .find((line) => line.length <= 120 && !line.includes("@") && !isName(line) && !/^(phone|mobile|email|location)\b/i.test(line)) ?? "";

  // Detect skills from comprehensive tech & soft skills dictionary
  const KNOWN_SKILLS = [
    "React", "JavaScript", "TypeScript", "HTML", "CSS", "WAI-ARIA", "Jest", "Git",
    "Python", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Node.js", "Express",
    "Docker", "AWS", "Azure", "GCP", "Kubernetes", "Linux", "Figma", "UI/UX",
    "Tailwind CSS", "Next.js", "Vue", "Angular", "Django", "FastAPI", "Java",
    "Spring Boot", "C++", "C#", ".NET", "Tableau", "PowerBI", "Excel", "Pandas",
    "NumPy", "Machine Learning", "Data Analysis", "Content Writing", "Technical Writing",
    "SEO", "Copywriting", "Project Management", "Agile", "Scrum", "Communication",
    "Accessibility", "WCAG", "Unit Testing", "REST API", "GraphQL", "CI/CD"
  ];

  const matchedSkills: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text) && !matchedSkills.includes(skill)) {
      matchedSkills.push(skill);
    }
  }

  // Extract Education block
  let education = "";
  const eduMatch = text.match(/(?:education|academic|qualifications)[\s\S]*?(?=(?:experience|employment|projects|skills|certifications|$))/i);
  if (eduMatch) {
    education = eduMatch[0].replace(/^(?:education|academic|qualifications)[:\s-]*/i, "").trim().slice(0, 300);
  } else {
    // Look for degree mentions
    const degreeLines = lines.filter((l) => /\b(B\.Tech|B\.E|B\.Sc|M\.Tech|M\.Sc|BCA|MCA|B\.A|MBA|Bachelor|Master|Diploma)\b/i.test(l));
    if (degreeLines.length > 0) education = degreeLines.slice(0, 2).join(". ");
  }

  // Extract Experience block
  let experience = "";
  const expMatch = text.match(/(?:experience|employment|work history)[\s\S]*?(?=(?:education|projects|skills|certifications|accommodations|$))/i);
  if (expMatch) {
    experience = expMatch[0].replace(/^(?:experience|employment|work history)[:\s-]*/i, "").trim().slice(0, 400);
  }

  // Extract certifications and location only when the resume explicitly provides them.
  const certificationMatch = text.match(/(?:certifications?|licenses?)[\s\S]*?(?=(?:education|experience|employment|projects|skills|accommodations|$))/i);
  const certifications = certificationMatch
    ? certificationMatch[0].replace(/^(?:certifications?|licenses?)[:\s-]*/i, "").trim().slice(0, 300)
    : "";
  const locationMatch = text.match(/(?:location|address|based in)\s*[:\-]?\s*([^\n|]+)/i);
  const preferredLocation = locationMatch?.[1]?.trim() ?? "";

  // Determine experience band
  let experienceBand: Profile["experienceBand"] = "";
  if (/\b(senior|lead|architect|5\+|6\+|7\+|8\+|9\+|10\+)\b/i.test(text)) {
    experienceBand = "5+ years";
  } else if (/\b(2-5|3 years|4 years|mid-level)\b/i.test(text)) {
    experienceBand = "2-5 years";
  } else if (/\b(fresher|intern|student|graduate|entry level)\b/i.test(text)) {
    experienceBand = "Fresher";
  }

  // Work preference
  let workPreference: Profile["workPreference"] = "";
  if (/\b(remote only|fully remote|remote work)\b/i.test(text)) {
    workPreference = "Remote";
  } else if (/\bhybrid\b/i.test(text)) {
    workPreference = "Hybrid";
  } else if (/\bon-site|onsite|in-office\b/i.test(text)) {
    workPreference = "On-site";
  }

  // Infer accessibility accommodations from resume keywords
  const suggestedAccommodations: AccessFeature[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("screen reader") || lower.includes("nvda") || lower.includes("jaws") || lower.includes("voiceover")) {
    suggestedAccommodations.push("screen_reader", "keyboard_friendly", "assistive_tech");
  }
  if (lower.includes("keyboard") || lower.includes("motor") || lower.includes("ergonomic") || lower.includes("mobility")) {
    if (!suggestedAccommodations.includes("keyboard_friendly")) suggestedAccommodations.push("keyboard_friendly");
    suggestedAccommodations.push("assistive_tech");
  }
  if (lower.includes("caption") || lower.includes("deaf") || lower.includes("hearing") || lower.includes("sign language")) {
    suggestedAccommodations.push("captioned_meetings");
  }
  if (lower.includes("wheelchair") || lower.includes("accessible workplace") || lower.includes("ramp") || lower.includes("elevator")) {
    suggestedAccommodations.push("accessible_workplace");
  }
  if (lower.includes("remote") || lower.includes("work from home")) {
    suggestedAccommodations.push("remote_work");
  }
  if (lower.includes("flexible")) {
    suggestedAccommodations.push("flexible_work");
  }
  if (suggestedAccommodations.length > 0 && !suggestedAccommodations.includes("accessible_interview")) {
    suggestedAccommodations.push("accessible_interview");
  }

  return {
    name,
    headline,
    email,
    education,
    experience,
    experienceBand,
    skills: matchedSkills,
    careerInterests: headline,
    certifications,
    preferredLocation,
    workPreference,
    suggestedAccommodations,
    rawText: text,
    confidence: Math.min(98, 70 + matchedSkills.length * 3),
  };
}
