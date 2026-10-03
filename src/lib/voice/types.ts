/**
 * JARVIS Hands-Free Voice Navigation System
 * Type definitions for voice recognition, command intents, speech synthesis, and DOM overlays.
 */

export type VoiceCommandType =
  // Navigation
  | "nav_jobs"
  | "nav_dashboard"
  | "nav_profile"
  | "nav_applications"
  | "nav_resume_match"
  | "nav_career_gps"
  | "nav_employer"
  | "nav_privacy"
  | "nav_home"
  | "nav_back"
  | "nav_forward"
  | "nav_reload"
  // Scrolling
  | "scroll_down"
  | "scroll_up"
  | "scroll_top"
  | "scroll_bottom"
  // Target & Click
  | "click_number"
  | "click_text"
  | "select_job"
  | "show_numbers"
  | "hide_numbers"
  // Search & Input
  | "search_query"
  | "type_text"
  | "clear_input"
  | "submit_form"
  // Accessibility Toggles
  | "toggle_contrast"
  | "toggle_dyslexia"
  | "toggle_ruler"
  | "toggle_captions"
  | "toggle_distraction"
  | "font_increase"
  | "font_decrease"
  | "font_reset"
  | "toggle_theme"
  // Reading & Speech
  | "read_page"
  | "stop_speech"
  // Assistant State
  | "sleep"
  | "wake"
  | "help"
  | "disable";

export type VoiceCommand = {
  type: VoiceCommandType;
  payload?: string | number;
  rawText: string;
  confidence?: number;
};

export type VoiceNavStatus =
  | "idle"
  | "listening"
  | "processing"
  | "executing"
  | "sleeping"
  | "unsupported"
  | "permission_denied"
  | "error";

export type VoiceNavConfig = {
  enabled: boolean;
  wakeWordRequired: boolean; // if true, commands must start with "Jarvis" or "Hey Jarvis"
  speechFeedback: boolean; // whether JARVIS speaks verbal confirmations aloud
  showNumberedBadges: boolean; // displays interactive numbered overlays on all clickable elements
  soundEffects: boolean; // futuristic audio chimes on wake/execute
  lang: string; // Speech recognition language, e.g. "en-IN", "en-US"
  ttsRate: number; // Voice playback rate (0.8 - 1.4)
};

export const DEFAULT_VOICE_NAV_CONFIG: VoiceNavConfig = {
  enabled: false,
  // Explicitly addressing JARVIS prevents ordinary conversation from becoming a command.
  wakeWordRequired: true,
  speechFeedback: true,
  showNumberedBadges: false,
  soundEffects: true,
  lang: "en-IN",
  ttsRate: 1.05,
};

export type ClickableTarget = {
  id: number;
  element: HTMLElement;
  label: string;
  rect: DOMRect;
  type: "link" | "button" | "input" | "select" | "tab" | "card";
};
