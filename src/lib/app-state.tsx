import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { JOBS, type Job } from "./jobs-data";

export type FontSize = "small" | "medium" | "large" | "x-large";
export type MotionPref = "normal" | "reduced";
export type LineSpacing = "normal" | "relaxed" | "loose";
export type AccessibilityPreset =
  | "custom"
  | "blind"
  | "motor"
  | "deaf"
  | "neurodivergent";

export type Profile = {
  name: string;
  displayName: string;
  pronouns: string;
  legalName: string;
  headline: string;
  email: string;
  skills: string[];
  education: string;
  experience: string;
  experienceBand: "" | "Fresher" | "0-2 years" | "2-5 years" | "5+ years";
  careerInterests: string;
  certifications: string;
  preferredLocation: string;
  workPreference: "" | "Remote" | "Hybrid" | "On-site" | "No preference";
  resumeName: string;
  resumeText: string;
  accessibilityPreferences: string[];
  shareAccessibilityWithEmployers: boolean;
  sharePronouns: boolean;
  shareAccommodationsByDefault: boolean;
  shareOtherPersonal: boolean;
  shareDisplayName: boolean;
  shareLegalName: boolean;
};

export const EMPTY_PROFILE: Profile = {
  name: "Alex Morgan",
  displayName: "Alex",
  pronouns: "they/them",
  legalName: "Alex Morgan",
  headline: "Frontend & Accessibility Engineer",
  email: "alex.morgan@inclusive-work.dev",
  skills: ["React", "TypeScript", "Tailwind CSS", "ARIA / WCAG", "Next.js"],
  education: "B.S. in Computer Science",
  experience: "3 years building accessible user interfaces",
  experienceBand: "2-5 years",
  careerInterests: "Accessible Web Applications, Design Systems, Inclusive Tech",
  certifications: "CPACC (Certified Professional in Accessibility Core Competencies)",
  preferredLocation: "Bengaluru / Remote",
  workPreference: "Remote",
  resumeName: "alex_morgan_resume_2026.pdf",
  resumeText: "",
  accessibilityPreferences: ["Screen reader friendly", "High contrast", "Flexible hours", "Captioning"],
  shareAccessibilityWithEmployers: true,
  sharePronouns: true,
  shareAccommodationsByDefault: true,
  shareOtherPersonal: false,
  shareDisplayName: true,
  shareLegalName: false,
};

export const DEFAULT_PROFILE: Profile = EMPTY_PROFILE;

export type VoiceNavConfig = {
  enabled: boolean;
  wakeWord: string;
  mode: "continuous" | "push_to_talk";
};

export const DEFAULT_VOICE_NAV_CONFIG: VoiceNavConfig = {
  enabled: false,
  wakeWord: "Jarvis",
  mode: "continuous",
};

export type AppStateContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  highContrast: boolean;
  setHighContrast: (val: boolean | ((prev: boolean) => boolean)) => void;
  contrastMode: "standard" | "high-contrast" | "tritanopia" | "dark";
  setContrastMode: (mode: "standard" | "high-contrast" | "tritanopia" | "dark") => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  lineSpacing: LineSpacing;
  setLineSpacing: (spacing: LineSpacing) => void;
  reducedDistraction: boolean;
  setReducedDistraction: (val: boolean | ((prev: boolean) => boolean)) => void;
  motion: MotionPref;
  setMotion: (motion: MotionPref) => void;
  dyslexiaFont: boolean;
  setDyslexiaFont: (val: boolean | ((prev: boolean) => boolean)) => void;
  liveCaptions: boolean;
  setLiveCaptions: (val: boolean | ((prev: boolean) => boolean)) => void;
  captionText: string;
  setCaptionText: (text: string) => void;
  activePreset: AccessibilityPreset;
  applyPreset: (preset: AccessibilityPreset) => void;
  readingRuler: boolean;
  setReadingRuler: (val: boolean | ((prev: boolean) => boolean)) => void;
  readingRulerHeight: number;
  setReadingRulerHeight: (val: number | ((prev: number) => number)) => void;
  ttsRate: number;
  setTtsRate: (rate: number) => void;
  voiceNavConfig: VoiceNavConfig;
  setVoiceNavEnabled: (enabled: boolean) => void;
  savedJobs: string[];
  toggleSavedJob: (id: string) => void;
  allJobs: Job[];
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  resetAccessibility: () => void;
};

const AppStateContext = createContext<AppStateContextType | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [highContrast, setHighContrast] = useState(false);
  const [contrastMode, setContrastModeState] = useState<"standard" | "high-contrast" | "tritanopia" | "dark">("standard");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("normal");
  const [reducedDistraction, setReducedDistraction] = useState(false);
  const [motion, setMotion] = useState<MotionPref>("normal");
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [liveCaptions, setLiveCaptions] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [activePreset, setActivePreset] = useState<AccessibilityPreset>("custom");
  const [readingRuler, setReadingRuler] = useState(false);
  const [readingRulerHeight, setReadingRulerHeight] = useState(48);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [voiceNavConfig, setVoiceNavConfig] = useState<VoiceNavConfig>(DEFAULT_VOICE_NAV_CONFIG);
  const [savedJobs, setSavedJobs] = useState<string[]>(["job-1", "job-3"]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

  // Sync state to DOM elements for WCAG 2.2 accessibility
  useEffect(() => {
    const root = document.documentElement;

    // Theme (Light/Dark)
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // High Contrast Mode
    if (highContrast || contrastMode === "high-contrast") {
      root.classList.add("hc");
    } else {
      root.classList.remove("hc");
    }

    // Font Size
    root.setAttribute("data-font-size", fontSize);

    // Line Spacing
    root.setAttribute("data-line-spacing", lineSpacing);

    // Reduced Motion
    root.setAttribute("data-motion", motion);

    // Dyslexia Font
    root.setAttribute("data-dyslexia", dyslexiaFont ? "true" : "false");

    // Reduced Distraction
    root.setAttribute("data-reduced-distraction", reducedDistraction ? "true" : "false");
  }, [theme, highContrast, contrastMode, fontSize, lineSpacing, motion, dyslexiaFont, reducedDistraction]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setContrastMode = useCallback((mode: "standard" | "high-contrast" | "tritanopia" | "dark") => {
    setContrastModeState(mode);
    if (mode === "high-contrast") {
      setHighContrast(true);
      setTheme("dark");
    } else if (mode === "dark") {
      setHighContrast(false);
      setTheme("dark");
    } else {
      setHighContrast(false);
      setTheme("light");
    }
  }, []);

  const applyPreset = useCallback((preset: AccessibilityPreset) => {
    setActivePreset(preset);
    if (preset === "blind") {
      setHighContrast(true);
      setFontSize("x-large");
      setMotion("reduced");
      setDyslexiaFont(false);
      setLineSpacing("loose");
    } else if (preset === "motor") {
      setFontSize("large");
      setMotion("reduced");
      setVoiceNavConfig((prev) => ({ ...prev, enabled: true }));
    } else if (preset === "deaf") {
      setLiveCaptions(true);
    } else if (preset === "neurodivergent") {
      setDyslexiaFont(true);
      setLineSpacing("relaxed");
      setReducedDistraction(true);
      setMotion("reduced");
    }
  }, []);

  const resetAccessibility = useCallback(() => {
    setTheme("light");
    setHighContrast(false);
    setContrastModeState("standard");
    setFontSize("medium");
    setLineSpacing("normal");
    setReducedDistraction(false);
    setMotion("normal");
    setDyslexiaFont(false);
    setLiveCaptions(false);
    setReadingRuler(false);
    setActivePreset("custom");
    setVoiceNavConfig(DEFAULT_VOICE_NAV_CONFIG);
  }, []);

  const setVoiceNavEnabled = useCallback((enabled: boolean) => {
    setVoiceNavConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const toggleSavedJob = useCallback((id: string) => {
    setSavedJobs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo<AppStateContextType>(
    () => ({
      theme,
      toggleTheme,
      highContrast,
      setHighContrast,
      contrastMode,
      setContrastMode,
      fontSize,
      setFontSize,
      lineSpacing,
      setLineSpacing,
      reducedDistraction,
      setReducedDistraction,
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
      readingRuler,
      setReadingRuler,
      readingRulerHeight,
      setReadingRulerHeight,
      ttsRate,
      setTtsRate,
      voiceNavConfig,
      setVoiceNavEnabled,
      savedJobs,
      toggleSavedJob,
      allJobs: JOBS,
      profile,
      updateProfile,
      resetAccessibility,
    }),
    [
      theme,
      toggleTheme,
      highContrast,
      contrastMode,
      setContrastMode,
      fontSize,
      lineSpacing,
      reducedDistraction,
      motion,
      dyslexiaFont,
      liveCaptions,
      captionText,
      activePreset,
      applyPreset,
      readingRuler,
      readingRulerHeight,
      ttsRate,
      voiceNavConfig,
      setVoiceNavEnabled,
      savedJobs,
      toggleSavedJob,
      profile,
      updateProfile,
      resetAccessibility,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
