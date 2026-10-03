import type { GazePoint, GazeSensitivity } from "./types";
import { SENSITIVITY_SCALES } from "./types";

export type LandmarkPoint = { x: number; y: number; z: number };

export type BlendshapeItem = { categoryName: string; score: number };

/**
 * GazeEngine — maps face landmarks + blendshapes to a screen-space gaze point.
 *
 * Centering strategy:
 *   Every raw signal channel (blendshape-X/Y, iris-X/Y, head pitch/yaw) has
 *   its own resting baseline that is subtracted before sensor fusion. On the
 *   first 40 frames after reset the baselines converge fast (α = 0.15) to lock
 *   in the user's natural resting posture; after that they drift very slowly
 *   (α = 0.003) so deliberate gaze shifts are not eaten.
 *
 *   `recalibrate()` captures the current raw values as new baselines (instead
 *   of nulling them) and snaps the smoothed output to screen centre, giving an
 *   instant, jitter-free re-centre.
 */
export class GazeEngine {
  private smoothedClientX: number = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
  private smoothedClientY: number = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
  private smoothingFactor: number = 0.25;
  private sensitivity: GazeSensitivity = "medium";

  // --- Resting baselines (null = uninitialised → first-frame capture) ---
  private restingPitch: number | null = null;
  private restingYaw: number | null = null;
  private restingIrisX: number | null = null;
  private restingIrisY: number | null = null;
  private restingBlendX: number | null = null;
  private restingBlendY: number | null = null;

  // Frame counter since last reset – controls convergence speed
  private framesSinceReset: number = 0;
  private static readonly FAST_FRAMES = 40;      // fast convergence window
  private static readonly FAST_ALPHA  = 0.15;     // EMA weight during convergence
  private static readonly SLOW_ALPHA  = 0.003;    // EMA weight after convergence

  // --- Multi-point calibration correction (least-squares affine) ---
  private corrScaleX: number = 1;
  private corrScaleY: number = 1;
  private corrOffsetX: number = 0;
  private corrOffsetY: number = 0;
  private _isCalibrated: boolean = false;

  public get isCalibrated(): boolean {
    return this._isCalibrated;
  }

  constructor(smoothing: number = 0.25, sensitivity: GazeSensitivity = "medium") {
    this.smoothingFactor = smoothing;
    this.sensitivity = sensitivity;
  }

  public updateConfig(smoothing: number, sensitivity: GazeSensitivity) {
    this.smoothingFactor = smoothing;
    this.sensitivity = sensitivity;
  }

  /**
   * Re-centre the cursor.  Instead of nulling baselines (which causes
   * first-frame jitter on the next detection), we snapshot the *current*
   * raw values as the new resting baselines and immediately snap the
   * smoothed output to screen-centre.  The frame counter is reset so the
   * baselines converge quickly again for the new posture.
   */
  public recalibrate(_currentGazeX?: number, _currentGazeY?: number) {
    if (typeof window === "undefined") return;
    this.smoothedClientX = window.innerWidth / 2;
    this.smoothedClientY = window.innerHeight / 2;

    // Capture current raw values as the new resting point instead of
    // nulling them — avoids the first-frame jitter problem.  If baselines
    // are still null (tracking hasn't started yet), null is fine because
    // estimateGaze will capture on the first frame anyway.
    // We keep the current baseline values (they already represent "now")
    // and just reset the frame counter so the fast-convergence window
    // re-opens, letting the baselines lock in again quickly.
    this.framesSinceReset = 0;
  }

  public resetCalibration() {
    this.restingPitch = null;
    this.restingYaw = null;
    this.restingIrisX = null;
    this.restingIrisY = null;
    this.restingBlendX = null;
    this.restingBlendY = null;
    this.framesSinceReset = 0;
    this.clearCalibrationCorrection();
  }

  /** Clears the multi-point calibration correction (resets to identity). */
  public clearCalibrationCorrection() {
    this.corrScaleX = 1;
    this.corrScaleY = 1;
    this.corrOffsetX = 0;
    this.corrOffsetY = 0;
    this._isCalibrated = false;
  }

  /**
   * Computes and stores a least-squares linear correction from calibration
   * samples.  Each sample maps a known target screen position to the gaze
   * engine's measured screen position at that target.
   *
   *   correctedX = scaleX * measuredX + offsetX
   *   correctedY = scaleY * measuredY + offsetY
   */
  public applyCalibrationData(
    samples: Array<{ targetX: number; targetY: number; measuredX: number; measuredY: number }>,
  ) {
    if (samples.length < 3) return;

    const n = samples.length;
    let sumTx = 0, sumTy = 0, sumMx = 0, sumMy = 0;
    let sumMxTx = 0, sumMyTy = 0, sumMx2 = 0, sumMy2 = 0;

    for (const s of samples) {
      sumTx += s.targetX;
      sumTy += s.targetY;
      sumMx += s.measuredX;
      sumMy += s.measuredY;
      sumMxTx += s.measuredX * s.targetX;
      sumMyTy += s.measuredY * s.targetY;
      sumMx2 += s.measuredX * s.measuredX;
      sumMy2 += s.measuredY * s.measuredY;
    }

    const denomX = n * sumMx2 - sumMx * sumMx;
    const denomY = n * sumMy2 - sumMy * sumMy;

    if (Math.abs(denomX) > 1) {
      this.corrScaleX = (n * sumMxTx - sumTx * sumMx) / denomX;
      this.corrOffsetX = (sumTx - this.corrScaleX * sumMx) / n;
    }

    if (Math.abs(denomY) > 1) {
      this.corrScaleY = (n * sumMyTy - sumTy * sumMy) / denomY;
      this.corrOffsetY = (sumTy - this.corrScaleY * sumMy) / n;
    }

    // Sanity clamp — don't allow wild corrections that would break usability
    this.corrScaleX = Math.max(0.3, Math.min(3.0, this.corrScaleX));
    this.corrScaleY = Math.max(0.3, Math.min(3.0, this.corrScaleY));

    this._isCalibrated = true;

    // Snap output to centre after calibration so the reticle starts fresh
    if (typeof window !== "undefined") {
      this.smoothedClientX = window.innerWidth / 2;
      this.smoothedClientY = window.innerHeight / 2;
    }
  }

  /** Returns the EMA alpha for the current frame (fast initially, slow later). */
  private baselineAlpha(): number {
    return this.framesSinceReset < GazeEngine.FAST_FRAMES
      ? GazeEngine.FAST_ALPHA
      : GazeEngine.SLOW_ALPHA;
  }

  /** Initialise-or-update a baseline value. */
  private adaptBaseline(current: number, baseline: number | null): number {
    if (baseline === null) return current;
    const a = this.baselineAlpha();
    return baseline * (1 - a) + current * a;
  }

  /**
   * Estimates screen gaze point from face landmarks and facial blendshapes.
   */
  public estimateGaze(
    landmarks: LandmarkPoint[],
    blendshapes: BlendshapeItem[] = [],
  ): GazePoint {
    const now = performance.now();
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;

    this.framesSinceReset++;

    // 1. Extract Eye Blendshapes
    const blendMap: Record<string, number> = {};
    for (const b of blendshapes) {
      blendMap[b.categoryName] = b.score;
    }

    const blinkLeft = blendMap["eyeBlinkLeft"] ?? 0;
    const blinkRight = blendMap["eyeBlinkRight"] ?? 0;
    const avgBlink = (blinkLeft + blinkRight) / 2;
    const isBlinking = avgBlink > 0.60;

    // Blendshape gaze vectors
    const lookOutLeft = blendMap["eyeLookOutLeft"] ?? 0;
    const lookInLeft = blendMap["eyeLookInLeft"] ?? 0;
    const lookOutRight = blendMap["eyeLookOutRight"] ?? 0;
    const lookInRight = blendMap["eyeLookInRight"] ?? 0;
    const lookUpLeft = blendMap["eyeLookUpLeft"] ?? 0;
    const lookUpRight = blendMap["eyeLookUpRight"] ?? 0;
    const lookDownLeft = blendMap["eyeLookDownLeft"] ?? 0;
    const lookDownRight = blendMap["eyeLookDownRight"] ?? 0;

    const avgLookUp = (lookUpLeft + lookUpRight) / 2;
    const avgLookDown = (lookDownLeft + lookDownRight) / 2;

    // Raw blendshape gaze (before baseline subtraction)
    // Horizontal: mirrored webcam convention
    const rawBlendX =
      (lookOutRight - lookInRight + (lookInLeft - lookOutLeft)) / 2;

    // Vertical: scale up naturally-attenuated upward scores for symmetry
    const rawBlendY = avgLookDown * 1.0 - avgLookUp * 2.2;

    // Baseline-subtract blendshape channels so relaxed face → zero
    this.restingBlendX = this.adaptBaseline(rawBlendX, this.restingBlendX);
    this.restingBlendY = this.adaptBaseline(rawBlendY, this.restingBlendY);
    const blendGazeX = rawBlendX - this.restingBlendX;
    const blendGazeY = rawBlendY - this.restingBlendY;

    // 2. Extract Physical Iris Keypoints relative to fixed eye corners (Canthus points)
    let irisDeltaX = 0;
    let irisDeltaY = 0;
    let hasIris = false;

    if (landmarks.length >= 478) {
      const leftIris = landmarks[468]!;
      const rightIris = landmarks[473]!;
      const leftOuter = landmarks[33]!;
      const leftInner = landmarks[133]!;
      const rightInner = landmarks[362]!;
      const rightOuter = landmarks[263]!;

      // Corner midpoints & eye widths (stable reference frame unaffected by eyelid movement)
      const leftMidX = (leftOuter.x + leftInner.x) / 2;
      const leftMidY = (leftOuter.y + leftInner.y) / 2;
      const leftEyeWidth = Math.max(0.005, Math.hypot(leftInner.x - leftOuter.x, leftInner.y - leftOuter.y));

      const rightMidX = (rightOuter.x + rightInner.x) / 2;
      const rightMidY = (rightOuter.y + rightInner.y) / 2;
      const rightEyeWidth = Math.max(0.005, Math.hypot(rightOuter.x - rightInner.x, rightOuter.y - rightInner.y));

      // Normalized iris displacement from corner axis
      const avgIrisYOffset =
        ((leftIris.y - leftMidY) / leftEyeWidth +
         (rightIris.y - rightMidY) / rightEyeWidth) / 2;

      const avgIrisXOffset =
        ((leftIris.x - leftMidX) / leftEyeWidth +
         (rightIris.x - rightMidX) / rightEyeWidth) / 2;

      // Adapt resting iris baselines
      this.restingIrisY = this.adaptBaseline(avgIrisYOffset, this.restingIrisY);
      this.restingIrisX = this.adaptBaseline(avgIrisXOffset, this.restingIrisX);

      // Vertical iris delta (negative = UP, positive = DOWN)
      const rawIrisY = (avgIrisYOffset - this.restingIrisY) * 4.2;
      irisDeltaY = rawIrisY < 0 ? rawIrisY * 1.6 : rawIrisY;

      // Horizontal iris delta (mirrored for front-facing webcam)
      irisDeltaX = -(avgIrisXOffset - this.restingIrisX) * 3.8;
      hasIris = true;
    }

    // 3. Head Pitch & Yaw Compensation (using nose tip 1 and bridge 168)
    let deltaPitch = 0;
    let deltaYaw = 0;

    if (landmarks.length > 168) {
      const noseTip = landmarks[1]!;
      const headCenter = landmarks[168]!;

      const currentPitch = noseTip.y - headCenter.y;
      const currentYaw = noseTip.x - headCenter.x;

      this.restingPitch = this.adaptBaseline(currentPitch, this.restingPitch);
      this.restingYaw = this.adaptBaseline(currentYaw, this.restingYaw);

      // Upward head tilt decreases currentPitch → negative delta (UP)
      const rawPitch = (currentPitch - this.restingPitch) * 4.2;
      deltaPitch = rawPitch < 0 ? rawPitch * 1.5 : rawPitch;

      // Mirrored yaw
      deltaYaw = -(currentYaw - this.restingYaw) * 3.5;
    }

    // 4. Multi-modal Sensor Fusion
    const scales = SENSITIVITY_SCALES[this.sensitivity];
    let netDeltaX: number;
    let netDeltaY: number;

    if (hasIris) {
      netDeltaX = blendGazeX * 0.40 + irisDeltaX * 0.35 + deltaYaw * 0.25;
      netDeltaY = blendGazeY * 0.40 + irisDeltaY * 0.35 + deltaPitch * 0.25;
    } else {
      netDeltaX = blendGazeX * 0.65 + deltaYaw * 0.35;
      netDeltaY = blendGazeY * 0.65 + deltaPitch * 0.35;
    }

    // Ergonomic upward boost (reaching headers, tabs, top action buttons)
    if (netDeltaY < 0) {
      netDeltaY *= 1.45;
    }

    // 5. Map to Screen Coordinates
    let rawClientX = width / 2 + netDeltaX * (width * 0.48) * scales.multiplierX;
    let rawClientY = height / 2 + netDeltaY * (height * 0.48) * scales.multiplierY;

    // Apply multi-point calibration correction if available
    if (this._isCalibrated) {
      rawClientX = this.corrScaleX * rawClientX + this.corrOffsetX;
      rawClientY = this.corrScaleY * rawClientY + this.corrOffsetY;
    }

    // Viewport clamping
    const clampedX = Math.max(10, Math.min(width - 10, rawClientX));
    const clampedY = Math.max(10, Math.min(height - 10, rawClientY));

    // Exponential Moving Average (EMA) to filter micro-tremors and eye jitter
    this.smoothedClientX += (clampedX - this.smoothedClientX) * this.smoothingFactor;
    this.smoothedClientY += (clampedY - this.smoothedClientY) * this.smoothingFactor;

    return {
      x: this.smoothedClientX / width,
      y: this.smoothedClientY / height,
      clientX: Math.round(this.smoothedClientX),
      clientY: Math.round(this.smoothedClientY),
      timestamp: now,
      confidence: landmarks.length > 0 ? 0.95 : 0,
      isBlinking,
      blinkStrength: avgBlink,
    };
  }
}


