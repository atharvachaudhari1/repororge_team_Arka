/**
 * Type definitions for Client-Side Hand Gesture Navigation.
 * MediaPipe landmarks: 21 points with normalized (x, y, z) coordinates.
 */

export type Landmark = {
  x: number;
  y: number;
  z: number;
};

export type StaticGesture = "pinch" | "open_palm" | "fist" | "thumbs_up";
export type DynamicGesture = "swipe_left" | "swipe_right" | "swipe_up" | "swipe_down";
export type HandGesture = StaticGesture | DynamicGesture;

export type GestureAction =
  | "next_job"
  | "previous_job"
  | "select"
  | "back"
  | "save_job"
  | "scroll_up"
  | "scroll_down"
  | "pause_gestures";

export type GestureSensitivity = "low" | "medium" | "high";

export type TimestampedLandmark = {
  landmarks: Landmark[];
  timestamp: number;
};

export type GestureStatus =
  | "idle"
  | "requesting_permission"
  | "permission_denied"
  | "unavailable"
  | "loading_model"
  | "detecting"
  | "paused"
  | "low_performance";

export type GestureConfig = {
  enabled: boolean;
  sensitivity: GestureSensitivity;
  holdTimeMs: number;
  cooldownMs: number;
  showPreview: boolean;
  mapping: Record<HandGesture, GestureAction | "none">;
};

export const DEFAULT_GESTURE_MAPPING: Record<HandGesture, GestureAction | "none"> = {
  swipe_right: "next_job",
  swipe_left: "previous_job",
  pinch: "select",
  thumbs_up: "save_job",
  swipe_up: "scroll_up",
  swipe_down: "scroll_down",
  fist: "pause_gestures",
  open_palm: "back",
};

export const SENSITIVITY_SETTINGS: Record<
  GestureSensitivity,
  { holdTimeMs: number; cooldownMs: number; swipeThreshold: number; pinchDistance: number }
> = {
  low: {
    holdTimeMs: 700,
    cooldownMs: 900,
    swipeThreshold: 0.22,
    pinchDistance: 0.05,
  },
  medium: {
    holdTimeMs: 500,
    cooldownMs: 700,
    swipeThreshold: 0.16,
    pinchDistance: 0.075,
  },
  high: {
    holdTimeMs: 350,
    cooldownMs: 500,
    swipeThreshold: 0.11,
    pinchDistance: 0.09,
  },
};

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  enabled: false,
  sensitivity: "medium",
  holdTimeMs: 500,
  cooldownMs: 700,
  showPreview: true,
  mapping: { ...DEFAULT_GESTURE_MAPPING },
};

export const GESTURE_LABELS: Record<
  HandGesture,
  { name: string; icon: string; description: string }
> = {
  pinch: {
    name: "Pinch",
    icon: "🤏",
    description: "Bring thumb and index fingertips together",
  },
  open_palm: {
    name: "Open Palm",
    icon: "✋",
    description: "All 5 fingers extended outward",
  },
  fist: {
    name: "Closed Fist",
    icon: "✊",
    description: "All fingers curled tightly into palm",
  },
  thumbs_up: {
    name: "Thumbs Up",
    icon: "👍",
    description: "Fingers closed with thumb extended upward",
  },
  swipe_left: {
    name: "Swipe Left",
    icon: "👈",
    description: "Move hand rapidly from right to left",
  },
  swipe_right: {
    name: "Swipe Right",
    icon: "👉",
    description: "Move hand rapidly from left to right",
  },
  swipe_up: {
    name: "Swipe Up",
    icon: "👆",
    description: "Move hand swiftly upwards",
  },
  swipe_down: {
    name: "Swipe Down",
    icon: "👇",
    description: "Move hand swiftly downwards",
  },
};

export const ACTION_LABELS: Record<GestureAction | "none", { label: string; description: string }> =
  {
    next_job: {
      label: "Next job card",
      description: "Focus or navigate to the next job in the list",
    },
    previous_job: {
      label: "Previous job card",
      description: "Focus or navigate to the previous job in the list",
    },
    select: {
      label: "Select / Open",
      description: "Open the active job details or activate focused element",
    },
    back: {
      label: "Go back",
      description: "Return to previous page or close active modal",
    },
    save_job: {
      label: "Save / Bookmark job",
      description: "Toggle bookmark status on the active job",
    },
    scroll_down: {
      label: "Scroll down",
      description: "Scroll page content downward",
    },
    scroll_up: {
      label: "Scroll up",
      description: "Scroll page content upward",
    },
    pause_gestures: {
      label: "Pause / Resume gestures",
      description: "Temporarily pause gesture triggers",
    },
    none: {
      label: "No action (Disabled)",
      description: "Do nothing when this gesture is recognized",
    },
  };
