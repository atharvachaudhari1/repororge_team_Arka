import type { HandGesture } from "./types";

export type HoldState = {
  triggeredGesture: HandGesture | null;
  activeGesture: HandGesture | null;
  progress: number;
  isCoolingDown: boolean;
};

/**
 * State machine managing gesture hold duration (default ~500ms)
 * and cooldown period between triggers to prevent accidental actions.
 */
export class GestureHoldTracker {
  private currentCandidate: HandGesture | null = null;
  private candidateStartTime: number = 0;
  private lastTriggerTime: number = 0;
  private hasTriggeredCurrentCandidate: boolean = false;

  constructor(
    public holdTimeMs: number = 500,
    public cooldownMs: number = 700,
  ) {}

  public reset(): void {
    this.currentCandidate = null;
    this.candidateStartTime = 0;
    this.hasTriggeredCurrentCandidate = false;
  }

  public updateConfig(holdTimeMs: number, cooldownMs: number): void {
    this.holdTimeMs = holdTimeMs;
    this.cooldownMs = cooldownMs;
  }

  public update(detectedGesture: HandGesture | null, now: number): HoldState {
    const isCoolingDown = now - this.lastTriggerTime < this.cooldownMs;

    // If no gesture or during cooldown, reset candidate hold
    if (!detectedGesture) {
      this.reset();
      return {
        triggeredGesture: null,
        activeGesture: null,
        progress: 0,
        isCoolingDown,
      };
    }

    if (isCoolingDown) {
      return {
        triggeredGesture: null,
        activeGesture: detectedGesture,
        progress: 0,
        isCoolingDown: true,
      };
    }

    // Dynamic swipe gestures trigger immediately upon detection if cooldown expired
    if (detectedGesture.startsWith("swipe_")) {
      this.lastTriggerTime = now;
      this.reset();
      return {
        triggeredGesture: detectedGesture,
        activeGesture: detectedGesture,
        progress: 1,
        isCoolingDown: false,
      };
    }

    // Static gestures (pinch, open_palm, fist, thumbs_up) require holding for holdTimeMs
    if (detectedGesture !== this.currentCandidate) {
      this.currentCandidate = detectedGesture;
      this.candidateStartTime = now;
      this.hasTriggeredCurrentCandidate = false;
      return {
        triggeredGesture: null,
        activeGesture: detectedGesture,
        progress: 0,
        isCoolingDown: false,
      };
    }

    // Already triggered for this continuous hold? Wait until user releases before triggering again
    if (this.hasTriggeredCurrentCandidate) {
      return {
        triggeredGesture: null,
        activeGesture: detectedGesture,
        progress: 1,
        isCoolingDown: false,
      };
    }

    const elapsed = now - this.candidateStartTime;
    const progress = Math.min(1, Math.max(0, elapsed / this.holdTimeMs));

    if (elapsed >= this.holdTimeMs) {
      this.lastTriggerTime = now;
      this.hasTriggeredCurrentCandidate = true;
      return {
        triggeredGesture: detectedGesture,
        activeGesture: detectedGesture,
        progress: 1,
        isCoolingDown: false,
      };
    }

    return {
      triggeredGesture: null,
      activeGesture: detectedGesture,
      progress,
      isCoolingDown: false,
    };
  }
}
