import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { JOBS, type AccessFeature, type Job } from "./jobs-data";

export type FontSize = "small" | "medium" | "large" | "x-large";
export type MotionPref = "normal" | "reduced";

export type Profile = {
  name: string;
  /** Name the candidate wants employers to see. Falls back to name. */
  displayName: string;
  /** Optional. Never required, never used in matching. */
  pronouns: string;
  /** Optional, only for later stages of an employer's process. Never shown by default. */
  legalName: string;
  headline: string;
  /** Contact email shared with employers on application. */
  email: string;
  skills: string[];
  education: string;
  experience: string;
  /** Self-declared experience band, used for match scoring. */
  experienceBand: "" | "Fresher" | "0-2 years" | "2-5 years" | "5+ years";
  careerInterests: string;
  certifications: string;
  preferredLocation: string;
  workPreference: "" | "Remote" | "Hybrid" | "On-site" | "No preference";
  resumeName: string;
  /** Pasted or extracted resume text, used for resume→job matching. */
  resumeText: string;
  /** Optional, private by default. Never shown publicly unless shared. */
  accessibilityPreferences: string[];
  shareAccessibilityWithEmployers: boolean;
  /** Privacy centre switches. Off means the field is never sent to employers. */
  sharePronouns: boolean;
  shareAccommodationsByDefault: boolean;
  shareOtherPersonal: boolean;
  /** Preferred (display) name visibility. On by default so employers can address you. */
  shareDisplayName: boolean;
  /** Legal name visibility. Off by default — only for later payroll/background stages. */
  shareLegalName: boolean;
};export const EMPTY_PROFILE: Profile = {
  name: "", displayName: "", pronouns: "", legalName: "",
  headline: "", email: "", skills: [], education: "", experience: "", experienceBand: "",
  careerInterests: "",
  certifications: "",
  preferredLocation: "",
  workPreference: "",
  resumeName: "",
  resumeText: "",
  accessibilityPreferences: [],
  shareAccessibilityWithEmployers: false,
  sharePronouns: false,
  shareAccommodationsByDefault: false,
  shareOtherPersonal: false,
  shareDisplayName: true,
  shareLegalName: false,
};

/** Privacy defaults applied by "Reset privacy settings". Private-first. */
export const DEFAULT_PRIVACY = {
  shareDisplayName: true,
  shareLegalName: false,
  sharePronouns: false,
  shareAccessibilityWithEmployers: false,
  shareAccommodationsByDefault: false,
  shareOtherPersonal: false,
} as const;

export const APPLICATION_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Offer",
  "Rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type AccessibilityPreset = "custom" | "blind" | "motor" | "deaf" | "cognitive";

export type Application = {
  jobId: string;
  status: ApplicationStatus;
  date: string;
  resumeName: string;
  coverLetter: string;
  /** Optional interview accommodation requests chosen by the candidate. */
  accommodations: string[];
  accommodationNote: string;
  /** Candidate decides whether accommodation requests are shared. */
  shareAccommodations: boolean;
  matchScore: number;
  nextStep: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewFormat?: string;
  accommodationsConfirmed?: boolean;
  emailSubject?: string;
  emailSnippet?: string;
};

/** Career GPS types */
export type CareerAssessment = {
  education: string;
  degree: string;
  skills: string[];
  experience: string;
  interests: string[];
  careerGoals: string;
  preferredWorkMode: string;
  preferredLocation: string;
};

export type CareerPathRecommendation = {
  title: string;
  fitScore: number;
  why: string;
  relevantSkills: string[];
  skillsToDevelop: string[];
  nextAction: string;
};

export type SkillGapItem = {
  skill: string;
  status: "strong" | "develop" | "unknown";
};

export type SkillGapAnalysis = {
  careerTitle: string;
  strongSkills: SkillGapItem[];
  skillsToDevelop: SkillGapItem[];
};

export type RoadmapMilestone = {
  id: string;
  week: number;
  title: string;
  whatToDo: string;
  whyItMatters: string;
  expectedOutcome: string;
  status: "not_started" | "in_progress" | "completed";
};

export type CareerRoadmap = {
  careerTitle: string;
  milestones: RoadmapMilestone[];
};

export type CareerReadiness = {
  careerTitle: string;
  readinessScore: number;
  strongestSkill: string;
  topSkillGap: string;
  milestonesCompleted: number;
  totalMilestones: number;
  nextAction: string;
};

export type PortfolioProject = {
  title: string;
  skillsPracticed: string[];
  projectGoal: string;
  recommendedFeatures: string[];
  expectedOutcome: string;
};

export type InterviewQuestion = {
  id: string;
  question: string;
  category: string;
};

export type InterviewFeedback = {
  technicalRelevance: number;
  completeness: number;
  structure: number;
  feedback: string;
  howToImprove: string;
};

export type InterviewSession = {
  careerTitle: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  feedback: InterviewFeedback | null;
};

export type FeedbackAnswer = "Yes" | "Partially" | "No";

/** Employer inclusion action plan (Phase 6). */
export const ACTION_STATUSES = ["not_started", "in_progress", "completed"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];
export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export type ActionItem = {
  id: string;
  label: string;
  status: ActionStatus;
};

export const FEEDBACK_CATEGORIES = [
  { key: "application", label: "Application" },
  { key: "interview", label: "Interview" },
  { key: "communication", label: "Communication" },
  { key: "assessment", label: "Assessment" },
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["key"];

export const FEEDBACK_BARRIERS = [
  "Screen-reader issue",
  "Keyboard accessibility issue",
  "Captioning issue",
  "Inaccessible assessment",
  "Communication barrier",
  "Missing accessibility information",
  "Other",
] as const;

/**
 * Accessibility feedback about a hiring process. Only aggregated ratings are
 * ever shown on an employer profile — never an individual submission.
 */
export type Feedback = {
  id: string;
  jobId: string;
  company: string;
  date: string;
  ratings: Partial<Record<FeedbackCategory, number>>;
  barriers: string[];
  note: string;
  /** Anonymous by default: no candidate name is stored with the submission. */
  anonymous: boolean;
  status: "Recorded";
};

type State = {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  fontSize: FontSize;
  setFontSize: (v: FontSize) => void;
  motion: MotionPref;
  setMotion: (v: MotionPref) => void;
  savedJobs: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  profile: Profile;
  saveProfile: (p: Profile) => void;
  profileCompletion: number;
  applications: Application[];
  apply: (app: Omit<Application, "status" | "date" | "nextStep"> & { nextStep?: string }) => void;
  setApplicationStatus: (jobId: string, status: ApplicationStatus, nextStep?: string) => void;
  hasApplied: (jobId: string) => boolean;
  getApplication: (jobId: string) => Application | undefined;
  employerJobs: Job[];
  addEmployerJob: (job: Job) => void;
  feedback: Feedback[];
  addFeedback: (f: Omit<Feedback, "id" | "date" | "status">) => void;
  hasFeedback: (jobId: string) => boolean;
  allJobs: Job[];
  findJob: (id: string) => Job | undefined;
  /* Career GPS */
  careerAssessment: CareerAssessment | null;
  saveCareerAssessment: (a: CareerAssessment) => void;
  careerDiscoveries: CareerPathRecommendation[];
  setCareerDiscoveries: (d: CareerPathRecommendation[]) => void;
  selectedCareer: string;
  setSelectedCareer: (c: string) => void;
  skillGap: SkillGapAnalysis | null;
  setSkillGap: (g: SkillGapAnalysis) => void;
  roadmap: CareerRoadmap | null;
  setRoadmap: (r: CareerRoadmap) => void;
  updateMilestoneStatus: (id: string, status: RoadmapMilestone["status"]) => void;
  portfolioProject: PortfolioProject | null;
  setPortfolioProject: (p: PortfolioProject) => void;
  interviewSession: InterviewSession | null;
  setInterviewSession: (s: InterviewSession) => void;
  updateInterviewAnswer: (questionId: string, answer: string) => void;
  setInterviewFeedback: (f: InterviewFeedback) => void;
  /* Phase 6 — Inclusion Intelligence */
  actionPlans: Record<string, ActionItem[]>;
  setActionItems: (company: string, items: ActionItem[]) => void;
  setActionStatus: (company: string, itemId: string, status: ActionStatus) => void;
  /* Disability & Multi-Modal Accessibility Features */
  dyslexiaFont: boolean;
  setDyslexiaFont: (v: boolean) => void;
  liveCaptions: boolean;
  setLiveCaptions: (v: boolean) => void;
  captionText: string;
  setCaptionText: (text: string) => void;
  activePreset: AccessibilityPreset;
  applyPreset: (preset: AccessibilityPreset) => void;
  voiceAssistantOpen: boolean;
  setVoiceAssistantOpen: (v: boolean) => void;
  accessUpdates: Record<string, AccessFeature[]>;
  updateJobAccess: (jobId: string, keys: AccessFeature[]) => void;
};

const Ctx = createContext<State | null>(null);
const KEY = "accesspath:state:v4";

function read<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [motion, setMotion] = useState<MotionPref>("normal");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [applications, setApplications] = useState<Application[]>([]);
  const [employerJobs, setEmployerJobs] = useState<Job[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  /* Disability & Multi-Modal Accessibility Features */
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [liveCaptions, setLiveCaptions] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [activePreset, setActivePresetState] = useState<AccessibilityPreset>("custom");
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  /* Career GPS */
  const [careerAssessment, setCareerAssessment] = useState<CareerAssessment | null>(null);
  const [careerDiscoveries, setCareerDiscoveries] = useState<CareerPathRecommendation[]>([]);
  const [selectedCareer, setSelectedCareer] = useState("");
  const [skillGap, setSkillGap] = useState<SkillGapAnalysis | null>(null);
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [portfolioProject, setPortfolioProject] = useState<PortfolioProject | null>(null);
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [actionPlans, setActionPlans] = useState<Record<string, ActionItem[]>>({});
  const [accessUpdates, setAccessUpdates] = useState<Record<string, AccessFeature[]>>({});

  useEffect(() => {
    const s = read({
      highContrast: false,
      fontSize: "medium" as FontSize,
      savedJobs: [] as string[],
      profile: EMPTY_PROFILE,
      applications: [] as Application[],
      employerJobs: [] as Job[],
      feedback: [] as Feedback[],
      motion: "normal" as MotionPref,
      dyslexiaFont: false,
      liveCaptions: false,
      activePreset: "custom" as AccessibilityPreset,
      careerAssessment: null as CareerAssessment | null,
      careerDiscoveries: [] as CareerPathRecommendation[],
      selectedCareer: "",
      skillGap: null as SkillGapAnalysis | null,
      roadmap: null as CareerRoadmap | null,
      portfolioProject: null as PortfolioProject | null,
      interviewSession: null as InterviewSession | null,
      actionPlans: {} as Record<string, ActionItem[]>,
      accessUpdates: {} as Record<string, AccessFeature[]>,
    });
    setHighContrast(s.highContrast);
    setFontSize(s.fontSize);
    setMotion(s.motion);
    setDyslexiaFont(s.dyslexiaFont ?? false);
    setLiveCaptions(s.liveCaptions ?? false);
    setActivePresetState(s.activePreset ?? "custom");
    setSavedJobs(s.savedJobs);
    setProfile({ ...EMPTY_PROFILE, ...s.profile });
    setApplications(
      s.applications && s.applications.length > 0
        ? s.applications
        : [
            {
              jobId: "j1",
              status: "Interview",
              date: "1 day ago",
              resumeName: "Atharva_Chaudhari_Resume.pdf",
              coverLetter:
                "Frontend Engineer passionate about building accessible and barrier-free web experiences.",
              accommodations: [
                "Screen-reader-compatible assessment",
                "Remote interview",
                "Additional assessment time",
              ],
              accommodationNote:
                "Require screen-reader accessible live coding environment and 15 mins setup time.",
              shareAccommodations: true,
              matchScore: 92,
              nextStep: "Technical Interview scheduled for Thursday, 3:00 PM IST.",
              interviewDate: "2026-10-08",
              interviewTime: "15:00 - 15:45 IST",
              interviewLocation: "Google Meet",
              interviewFormat: "Remote (Google Meet with Live Captions)",
              accommodationsConfirmed: true,
              emailSubject:
                "Interview Confirmation: Junior Frontend Developer at TechNova India",
              emailSnippet:
                "Hello Atharva, We have confirmed your technical interview. All requested accessibility accommodations have been approved.",
            },
            {
              jobId: "j2",
              status: "Under Review",
              date: "3 days ago",
              resumeName: "Atharva_Chaudhari_Resume.pdf",
              coverLetter:
                "Data enthusiast with expertise in accessible dashboard visualization.",
              accommodations: ["Captioned interview", "Flexible scheduling"],
              accommodationNote: "Prefer written or captioned communication.",
              shareAccommodations: true,
              matchScore: 88,
              nextStep: "Application under hiring manager review.",
            },
          ],
    );
    setEmployerJobs(s.employerJobs);
    setFeedback(s.feedback);
    setCareerAssessment(s.careerAssessment);
    setCareerDiscoveries(s.careerDiscoveries);
    setSelectedCareer(s.selectedCareer);
    setSkillGap(s.skillGap);
    setRoadmap(s.roadmap);
    setPortfolioProject(s.portfolioProject);
    setInterviewSession(s.interviewSession);
    setActionPlans(s.actionPlans);
    setAccessUpdates(s.accessUpdates);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        highContrast,
        fontSize,
        motion,
        dyslexiaFont,
        liveCaptions,
        activePreset,
        savedJobs,
        profile,
        applications,
        employerJobs,
        feedback,
        careerAssessment,
        careerDiscoveries,
        selectedCareer,
        skillGap,
        roadmap,
        portfolioProject,
        interviewSession,
        actionPlans,
        accessUpdates,
      }),
    );
  }, [
    hydrated,
    highContrast,
    fontSize,
    motion,
    dyslexiaFont,
    liveCaptions,
    activePreset,
    savedJobs,
    profile,
    applications,
    employerJobs,
    feedback,
    careerAssessment,
    careerDiscoveries,
    selectedCareer,
    skillGap,
    roadmap,
    portfolioProject,
    interviewSession,
    actionPlans,
    accessUpdates,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("hc", highContrast);
    document.documentElement.dataset["fontSize"] = fontSize;
    document.documentElement.dataset["motion"] = motion;
  }, [highContrast, fontSize, motion]);

  const toggleSaved = useCallback((id: string) => {
    setSavedJobs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }, []);

  const profileCompletion = useMemo(() => {
    const checks = [
      profile.name,
      profile.headline,
      profile.skills.length > 0,
      profile.education,
      profile.experience,
      profile.experienceBand,
      profile.careerInterests,
      profile.certifications,
      profile.preferredLocation,
      profile.workPreference,
      profile.resumeName || profile.resumeText,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile]);

  const allJobs = useMemo(() => {
    const base = [...employerJobs, ...JOBS];
    // Employer transparency updates flow straight to future candidates. Updates
    // always appear as "Employer provided" — never as Verified.
    return base.map((j) => {
      const extra = accessUpdates[j.id];
      if (!extra?.length) return j;
      return {
        ...j,
        access: Array.from(new Set([...j.access, ...extra])),
        accessUpdated: true,
      } as Job;
    });
  }, [employerJobs, accessUpdates]);

  const applyPreset = useCallback((preset: AccessibilityPreset) => {
    setActivePresetState(preset);
    if (preset === "blind") {
      setHighContrast(true);
      setFontSize("x-large");
      setMotion("reduced");
      setLiveCaptions(true);
      setDyslexiaFont(false);
    } else if (preset === "motor") {
      setFontSize("large");
      setMotion("reduced");
      setLiveCaptions(false);
      setDyslexiaFont(false);
      setVoiceAssistantOpen(true);
    } else if (preset === "deaf") {
      setLiveCaptions(true);
      setHighContrast(false);
    } else if (preset === "cognitive") {
      setDyslexiaFont(true);
      setMotion("reduced");
      setFontSize("large");
    } else if (preset === "custom") {
      setHighContrast(false);
      setFontSize("medium");
      setMotion("normal");
      setDyslexiaFont(false);
      setLiveCaptions(false);
      setVoiceAssistantOpen(false);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset["dyslexia"] = dyslexiaFont ? "true" : "false";
  }, [dyslexiaFont]);

  const value: State = {
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    motion,
    setMotion,
    dyslexiaFont,
    setDyslexiaFont,
    liveCaptions,
    setLiveCaptions,
    captionText,
    setCaptionText,
    activePreset,
    applyPreset,
    voiceAssistantOpen,
    setVoiceAssistantOpen,
    savedJobs,
    toggleSaved,
    isSaved: (id) => savedJobs.includes(id),
    profile,
    saveProfile: setProfile,
    profileCompletion,
    applications,
    apply: (app) =>
      setApplications((prev) =>
        prev.some((a) => a.jobId === app.jobId)
          ? prev
          : [
              {
                ...app,
                status: "Applied" as ApplicationStatus,
                date: new Date().toISOString().slice(0, 10),
                nextStep: app.nextStep ?? "Employer review — you'll see status changes here.",
              },
              ...prev,
            ],
      ),
    setApplicationStatus: (jobId, status, nextStep) =>
      setApplications((prev) =>
        prev.map((a) =>
          a.jobId === jobId ? { ...a, status, nextStep: nextStep ?? NEXT_STEPS[status] } : a,
        ),
      ),
    hasApplied: (jobId) => applications.some((a) => a.jobId === jobId),
    getApplication: (jobId) => applications.find((a) => a.jobId === jobId),
    employerJobs,
    addEmployerJob: (job) => setEmployerJobs((prev) => [job, ...prev]),
    feedback,
    addFeedback: (f) =>
      setFeedback((prev) => [
        {
          ...f,
          id: `${f.jobId}-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          status: "Recorded" as const,
        },
        ...prev,
      ]),
    hasFeedback: (jobId) => feedback.some((f) => f.jobId === jobId),
    allJobs,
    findJob: (id) => allJobs.find((j) => j.id === id),
    /* Career GPS */
    careerAssessment,
    saveCareerAssessment: setCareerAssessment,
    careerDiscoveries,
    setCareerDiscoveries,
    selectedCareer,
    setSelectedCareer,
    skillGap,
    setSkillGap,
    roadmap,
    setRoadmap,
    updateMilestoneStatus: (id, status) =>
      setRoadmap((prev) =>
        prev
          ? {
              ...prev,
              milestones: prev.milestones.map((m) => (m.id === id ? { ...m, status } : m)),
            }
          : prev,
      ),
    portfolioProject,
    setPortfolioProject,
    interviewSession,
    setInterviewSession,
    updateInterviewAnswer: (questionId, answer) =>
      setInterviewSession((prev) =>
        prev ? { ...prev, answers: { ...prev.answers, [questionId]: answer } } : prev,
      ),
    setInterviewFeedback: (feedback) =>
      setInterviewSession((prev) => (prev ? { ...prev, feedback } : prev)),
    /* Phase 6 */
    actionPlans,
    setActionItems: (company, items) => setActionPlans((prev) => ({ ...prev, [company]: items })),
    setActionStatus: (company, itemId, status) =>
      setActionPlans((prev) => ({
        ...prev,
        [company]: (prev[company] ?? []).map((a) => (a.id === itemId ? { ...a, status } : a)),
      })),
    accessUpdates,
    updateJobAccess: (jobId, keys) =>
      setAccessUpdates((prev) => ({
        ...prev,
        [jobId]: Array.from(new Set([...(prev[jobId] ?? []), ...keys])),
      })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const NEXT_STEPS: Record<ApplicationStatus, string> = {
  Applied: "Employer review — you'll see status changes here.",
  "Under Review": "The hiring team is reviewing your profile and resume.",
  Shortlisted: "Expect an interview invitation with format and accessibility details.",
  Interview: "Confirm your interview slot and any accommodation you requested.",
  Offer: "Review the offer details and respond to the employer.",
  Rejected: "Not this time. Your match insights can guide the next application.",
};

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
