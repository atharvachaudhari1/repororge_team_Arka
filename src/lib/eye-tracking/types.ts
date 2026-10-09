/**
 * Types and configurations for Ableo's Eye Tracking & Gaze Navigation System.
 * Designed for users with severe motor disabilities, ALS, quadriplegia, or spinal injuries.
 */

export type GazeSensitivity = "low" | "medium" | "high";

export type EyeTrackingClickMode = "dwell" | "blink" | "both";

export type EyeTrackingStatus =
  | "idle"
  | "requesting_permission"
  | "initializing"
  | "loading_model"
  | "tracking"
  | "calibrating"
  | "low_confidence"
  | "paused"
  | "error";

export type CalibrationMode = "5-point" | "9-point";

export type CalibrationSample = {
  targetX: number;
  targetY: number;
  measuredX: number;
  measuredY: number;
};

export type CalibrationMetrics = {
  rmse: number; // Root Mean Square Error in pixels
  qualityScore: number; // 0 to 100%
  mode: CalibrationMode;
  timestamp: number;
};

export type EyeTrackingConfig = {
  enabled: boolean;
  dwellTimeMs: number;
  dwellRadiusPx: number;
  sensitivity: GazeSensitivity;
  showPointer: boolean;
  showCameraPreview: boolean;
  edgeScrollEnabled: boolean;
  clickMode: EyeTrackingClickMode;
  smoothingFactor: number; // 0.1 to 0.5 (lower = smoother, higher = snappier)
  calibrationMode: CalibrationMode;
};

export const DEFAULT_EYE_TRACKING_CONFIG: EyeTrackingConfig = {
  enabled: false,
  dwellTimeMs: 1000,
  dwellRadiusPx: 55,
  sensitivity: "medium",
  showPointer: true,
  showCameraPreview: true,
  edgeScrollEnabled: true,
  clickMode: "both",
  smoothingFactor: 0.25,
  calibrationMode: "9-point",
};

export const SENSITIVITY_SCALES: Record<GazeSensitivity, { multiplierX: number; multiplierY: number }> = {
  low: { multiplierX: 2.2, multiplierY: 2.6 },
  medium: { multiplierX: 3.2, multiplierY: 3.6 },
  high: { multiplierX: 4.5, multiplierY: 4.8 },
};

export type GazePoint = {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  timestamp: number;
  confidence: number;
  isBlinking: boolean;
  blinkStrength: number;
};

export type DwellTarget = {
  element: HTMLElement | null;
  startTime: number;
  progress: number; // 0 to 1
  x: number;
  y: number;
};
