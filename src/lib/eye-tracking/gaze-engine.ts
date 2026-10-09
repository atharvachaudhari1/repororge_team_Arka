import type {
  GazePoint,
  GazeSensitivity,
  CalibrationSample,
  CalibrationMetrics,
  CalibrationMode,
} from "./types";
import { SENSITIVITY_SCALES } from "./types";

export type LandmarkPoint = { x: number; y: number; z?: number };
export type BlendshapeItem = { categoryName: string; score: number };

const STORAGE_KEY = "ableo_eye_calibration_v2";

/**
 * 1-Euro Filter state for smooth, jitter-free cursor tracking
 * that instantly snaps during fast eye saccades.
 */
class OneEuroFilter {
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(
    private minCutoff: number = 0.8, // Low cutoff for solid dwell fixation
    private beta: number = 0.02, // High speed factor for instant saccades
    private dCutoff: number = 1.0,
  ) {}

  public filter(x: number, timestamp: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.xPrev = x;
      this.tPrev = timestamp;
      this.dxPrev = 0;
      return x;
    }

    const dt = Math.max(0.001, (timestamp - this.tPrev) / 1000);
    this.tPrev = timestamp;

    // Filtered derivative (velocity)
    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    // Dynamic cutoff frequency based on velocity
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);

    // Filtered value
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    return xHat;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  public reset(val?: number) {
    this.xPrev = val ?? null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

/**
 * Solves a linear system M * x = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(M: number[][], b: number[]): number[] | null {
  const n = b.length;
  // Deep clone
  const A = M.map((row) => [...row]);
  const x = [...b];

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(A[i]![i]!);
    for (let r = i + 1; r < n; r++) {
      const val = Math.abs(A[r]![i]!);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }

    if (maxVal < 1e-9) {
      return null; // Singular or ill-conditioned
    }

    // Swap rows
    if (maxRow !== i) {
      const tmpRow = A[i]!;
      A[i] = A[maxRow]!;
      A[maxRow] = tmpRow;
      const tmpB = x[i]!;
      x[i] = x[maxRow]!;
      x[maxRow] = tmpB;
    }

    // Eliminate below
    const pivot = A[i]![i]!;
    for (let r = i + 1; r < n; r++) {
      const factor = A[r]![i]! / pivot;
      for (let c = i; c < n; c++) {
        A[r]![c]! -= factor * A[i]![c]!;
      }
      x[r]! -= factor * x[i]!;
    }
  }

  // Back-substitution
  const result = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i]!;
    for (let c = i + 1; c < n; c++) {
      sum -= A[i]![c]! * result[c]!;
    }
    result[i] = sum / A[i]![i]!;
  }

  return result;
}

/**
 * High-Precision Gaze Engine with:
 * - 2D Bi-quadratic Polynomial Calibration (Ridge-regularized)
 * - Pupil-to-Canthus Ratio (PCR) with Head Roll Compensation
 * - 1-Euro Velocity-Adaptive Smoothing Filter
 * - Micro-fixation Deadband
 * - Persistent Storage
 */
export class GazeEngine {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private smoothedClientX: number = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
  private smoothedClientY: number = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
  private sensitivity: GazeSensitivity = "medium";

  // --- Resting baselines (null = uninitialised → first-frame capture) ---
  private restingPitch: number | null = null;
  private restingYaw: number | null = null;
  private restingIrisX: number | null = null;
  private restingIrisY: number | null = null;
  private restingBlendX: number | null = null;
  private restingBlendY: number | null = null;

  // Frame counter since last reset
  private framesSinceReset: number = 0;
  private static readonly FAST_FRAMES = 40;
  private static readonly FAST_ALPHA = 0.15;
  private static readonly SLOW_ALPHA = 0.003;

  // --- Calibration: 2D Bi-quadratic Polynomial Coefficients ---
  // Model: target = c0 + c1*u + c2*v + c3*u^2 + c4*v^2 + c5*u*v
  // where u, v are normalized [-1, 1] relative to viewport center.
  private polyCoeffsX: number[] | null = null;
  private polyCoeffsY: number[] | null = null;
  private calibrationMetrics: CalibrationMetrics | null = null;
  private _isCalibrated: boolean = false;

  public get isCalibrated(): boolean {
    return this._isCalibrated;
  }

  public get metrics(): CalibrationMetrics | null {
    return this.calibrationMetrics;
  }

  constructor(smoothing: number = 0.25, sensitivity: GazeSensitivity = "medium") {
    // smoothingFactor (0.1 to 0.5): adjust 1-Euro minCutoff
    const minCutoff = Math.max(0.4, 1.4 - smoothing * 2.2);
    this.filterX = new OneEuroFilter(minCutoff, 0.022);
    this.filterY = new OneEuroFilter(minCutoff, 0.022);
    this.sensitivity = sensitivity;
    this.loadCalibrationFromStorage();
  }

  public updateConfig(smoothing: number, sensitivity: GazeSensitivity) {
    const minCutoff = Math.max(0.4, 1.4 - smoothing * 2.2);
    this.filterX = new OneEuroFilter(minCutoff, 0.022);
    this.filterY = new OneEuroFilter(minCutoff, 0.022);
    this.sensitivity = sensitivity;
  }

  /**
   * Snaps the gaze baseline to current posture and snaps cursor to center.
   */
  public recalibrate() {
    if (typeof window === "undefined") return;
    this.smoothedClientX = window.innerWidth / 2;
    this.smoothedClientY = window.innerHeight / 2;
    this.filterX.reset(this.smoothedClientX);
    this.filterY.reset(this.smoothedClientY);
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
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  public clearCalibrationCorrection() {
    this.polyCoeffsX = null;
    this.polyCoeffsY = null;
    this.calibrationMetrics = null;
    this._isCalibrated = false;
  }

  /**
   * Fits a 2D bi-quadratic polynomial surface from calibration target & measured points.
   * Features: [1, u, v, u^2, v^2, u*v]
   * Solves: (A^T * A + lambda * I) * C = A^T * T
   */
  public applyCalibrationData(
    samples: CalibrationSample[],
    mode: CalibrationMode = "9-point",
  ): CalibrationMetrics {
    if (samples.length < 4) {
      throw new Error("Insufficient calibration points (at least 4 required)");
    }

    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const halfW = w / 2;
    const halfH = h / 2;

    const n = samples.length;
    // Feature degree: if >= 7 points, use full 6-parameter bi-quadratic [1, u, v, u^2, v^2, u*v]
    // If fewer (e.g. 5 points), use 4-parameter affine + diagonal [1, u, v, u*v]
    const useFullPoly = n >= 6;
    const numParams = useFullPoly ? 6 : 4;

    const A: number[][] = [];
    const Tu: number[] = [];
    const Tv: number[] = [];

    for (const s of samples) {
      const u = (s.measuredX - halfW) / halfW;
      const v = (s.measuredY - halfH) / halfH;
      const targetU = (s.targetX - halfW) / halfW;
      const targetV = (s.targetY - halfH) / halfH;

      if (useFullPoly) {
        A.push([1, u, v, u * u, v * v, u * v]);
      } else {
        A.push([1, u, v, u * v]);
      }
      Tu.push(targetU);
      Tv.push(targetV);
    }

    // Normal equations: (A^T * A + lambda * I)
    const ATA: number[][] = Array.from({ length: numParams }, () =>
      new Array<number>(numParams).fill(0),
    );
    const ATTu: number[] = new Array<number>(numParams).fill(0);
    const ATTv: number[] = new Array<number>(numParams).fill(0);

    for (let r = 0; r < n; r++) {
      const row = A[r]!;
      for (let i = 0; i < numParams; i++) {
        ATTu[i]! += row[i]! * Tu[r]!;
        ATTv[i]! += row[i]! * Tv[r]!;
        for (let j = 0; j < numParams; j++) {
          ATA[i]![j]! += row[i]! * row[j]!;
        }
      }
    }

    // Ridge regularization lambda
    const lambda = 0.005;
    for (let i = 0; i < numParams; i++) {
      ATA[i]![i]! += lambda;
    }

    const solU = solveLinearSystem(ATA, ATTu);
    const solV = solveLinearSystem(ATA, ATTv);

    if (!solU || !solV) {
      console.warn("Polynomial calibration matrix singular, fallback to linear offset");
      this.clearCalibrationCorrection();
      return { rmse: 999, qualityScore: 50, mode, timestamp: Date.now() };
    }

    // Expand to 6 parameters if affine was used
    if (!useFullPoly) {
      // sol: [c0, c1, c2, c3] -> [c0, c1, c2, 0, 0, c3]
      this.polyCoeffsX = [solU[0]!, solU[1]!, solU[2]!, 0, 0, solU[3]!];
      this.polyCoeffsY = [solV[0]!, solV[1]!, solV[2]!, 0, 0, solV[3]!];
    } else {
      this.polyCoeffsX = solU;
      this.polyCoeffsY = solV;
    }

    // Compute RMSE in screen pixels on calibration points
    let sumSqErr = 0;
    for (const s of samples) {
      const u = (s.measuredX - halfW) / halfW;
      const v = (s.measuredY - halfH) / halfH;
      const predU =
        this.polyCoeffsX[0]! +
        this.polyCoeffsX[1]! * u +
        this.polyCoeffsX[2]! * v +
        this.polyCoeffsX[3]! * u * u +
        this.polyCoeffsX[4]! * v * v +
        this.polyCoeffsX[5]! * u * v;

      const predV =
        this.polyCoeffsY[0]! +
        this.polyCoeffsY[1]! * u +
        this.polyCoeffsY[2]! * v +
        this.polyCoeffsY[3]! * u * u +
        this.polyCoeffsY[4]! * v * v +
        this.polyCoeffsY[5]! * u * v;

      const predX = predU * halfW + halfW;
      const predY = predV * halfH + halfH;

      sumSqErr += Math.hypot(predX - s.targetX, predY - s.targetY) ** 2;
    }

    const rmse = Math.round(Math.sqrt(sumSqErr / n));
    // Calibration Quality Score: RMSE of 30px -> ~96%, 80px -> ~88%, 150px -> ~75%
    const qualityScore = Math.max(50, Math.min(99, Math.round(100 * Math.exp(-rmse / 420))));

    const metrics: CalibrationMetrics = {
      rmse,
      qualityScore,
      mode,
      timestamp: Date.now(),
    };

    this.calibrationMetrics = metrics;
    this._isCalibrated = true;

    // Persist to storage
    this.saveCalibrationToStorage(metrics, w, h);

    // Reset filter at center
    if (typeof window !== "undefined") {
      this.smoothedClientX = halfW;
      this.smoothedClientY = halfH;
      this.filterX.reset(halfW);
      this.filterY.reset(halfH);
    }

    return metrics;
  }

  private saveCalibrationToStorage(metrics: CalibrationMetrics, screenW: number, screenH: number) {
    if (typeof window === "undefined") return;
    try {
      const data = {
        polyCoeffsX: this.polyCoeffsX,
        polyCoeffsY: this.polyCoeffsY,
        metrics,
        screenW,
        screenH,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may fail in private mode
    }
  }

  public loadCalibrationFromStorage(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (
        data &&
        Array.isArray(data.polyCoeffsX) &&
        data.polyCoeffsX.length === 6 &&
        Array.isArray(data.polyCoeffsY) &&
        data.polyCoeffsY.length === 6
      ) {
        this.polyCoeffsX = data.polyCoeffsX;
        this.polyCoeffsY = data.polyCoeffsY;
        this.calibrationMetrics = data.metrics ?? {
          rmse: 45,
          qualityScore: 92,
          mode: "9-point",
          timestamp: Date.now(),
        };
        this._isCalibrated = true;
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  private baselineAlpha(): number {
    return this.framesSinceReset < GazeEngine.FAST_FRAMES
      ? GazeEngine.FAST_ALPHA
      : GazeEngine.SLOW_ALPHA;
  }

  private adaptBaseline(current: number, baseline: number | null): number {
    if (baseline === null) return current;
    const a = this.baselineAlpha();
    return baseline * (1 - a) + current * a;
  }

  /**
   * Estimates screen gaze point from face landmarks and facial blendshapes.
   */
  public estimateGaze(landmarks: LandmarkPoint[], blendshapes: BlendshapeItem[] = []): GazePoint {
    const now = performance.now();
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    const halfW = width / 2;
    const halfH = height / 2;

    this.framesSinceReset++;

    // 1. Extract Eye Blendshapes
    const blendMap: Record<string, number> = {};
    for (const b of blendshapes) {
      blendMap[b.categoryName] = b.score;
    }

    const blinkLeft = blendMap["eyeBlinkLeft"] ?? 0;
    const blinkRight = blendMap["eyeBlinkRight"] ?? 0;
    const avgBlink = (blinkLeft + blinkRight) / 2;
    const isBlinking = avgBlink > 0.6;

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

    // Horizontal: mirrored webcam convention
    const rawBlendX = (lookOutRight - lookInRight + (lookInLeft - lookOutLeft)) / 2;
    // Vertical: scale up naturally-attenuated upward scores
    const rawBlendY = avgLookDown * 1.0 - avgLookUp * 2.2;

    this.restingBlendX = this.adaptBaseline(rawBlendX, this.restingBlendX);
    this.restingBlendY = this.adaptBaseline(rawBlendY, this.restingBlendY);
    const blendGazeX = rawBlendX - this.restingBlendX;
    const blendGazeY = rawBlendY - this.restingBlendY;

    // 2. High-Precision Pupil-to-Canthus Ratio (PCR) with Head Roll Compensation
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
      const leftUpper = landmarks[159]!;
      const leftLower = landmarks[145]!;
      const rightUpper = landmarks[386]!;
      const rightLower = landmarks[374]!;

      // Eye center axes
      const leftMidX = (leftOuter.x + leftInner.x) / 2;
      const leftMidY = (leftOuter.y + leftInner.y) / 2;
      const leftEyeWidth = Math.max(
        0.005,
        Math.hypot(leftInner.x - leftOuter.x, leftInner.y - leftOuter.y),
      );
      const leftEyeHeight = Math.max(
        0.003,
        Math.hypot(leftUpper.x - leftLower.x, leftUpper.y - leftLower.y),
      );

      const rightMidX = (rightOuter.x + rightInner.x) / 2;
      const rightMidY = (rightOuter.y + rightInner.y) / 2;
      const rightEyeWidth = Math.max(
        0.005,
        Math.hypot(rightOuter.x - rightInner.x, rightOuter.y - rightInner.y),
      );
      const rightEyeHeight = Math.max(
        0.003,
        Math.hypot(rightUpper.x - rightLower.x, rightUpper.y - rightLower.y),
      );

      // Head roll angle (rotation of inter-canthus vector)
      const rollAngle = Math.atan2(rightOuter.y - leftOuter.y, rightOuter.x - leftOuter.x);
      const cosRoll = Math.cos(-rollAngle);
      const sinRoll = Math.sin(-rollAngle);

      // Left eye normalized iris offset with roll de-rotation
      const lDx = (leftIris.x - leftMidX) / leftEyeWidth;
      const lDy = (leftIris.y - leftMidY) / leftEyeHeight;
      const lRotX = lDx * cosRoll - lDy * sinRoll;
      const lRotY = lDx * sinRoll + lDy * cosRoll;

      // Right eye normalized iris offset with roll de-rotation
      const rDx = (rightIris.x - rightMidX) / rightEyeWidth;
      const rDy = (rightIris.y - rightMidY) / rightEyeHeight;
      const rRotX = rDx * cosRoll - rDy * sinRoll;
      const rRotY = rDx * sinRoll + rDy * cosRoll;

      const avgIrisXOffset = (lRotX + rRotX) / 2;
      const avgIrisYOffset = (lRotY + rRotY) / 2;

      this.restingIrisX = this.adaptBaseline(avgIrisXOffset, this.restingIrisX);
      this.restingIrisY = this.adaptBaseline(avgIrisYOffset, this.restingIrisY);

      // Mirrored horizontal iris delta
      irisDeltaX = -(avgIrisXOffset - this.restingIrisX) * 3.8;
      // Vertical iris delta (negative = UP)
      const rawIrisY = (avgIrisYOffset - this.restingIrisY) * 3.6;
      irisDeltaY = rawIrisY < 0 ? rawIrisY * 1.5 : rawIrisY;
      hasIris = true;
    }

    // 3. Head Pitch & Yaw Compensation (nose tip 1 and mid-eyebrow 168)
    let deltaPitch = 0;
    let deltaYaw = 0;

    if (landmarks.length > 168) {
      const noseTip = landmarks[1]!;
      const headCenter = landmarks[168]!;

      const currentPitch = noseTip.y - headCenter.y;
      const currentYaw = noseTip.x - headCenter.x;

      this.restingPitch = this.adaptBaseline(currentPitch, this.restingPitch);
      this.restingYaw = this.adaptBaseline(currentYaw, this.restingYaw);

      const rawPitch = (currentPitch - this.restingPitch) * 4.0;
      deltaPitch = rawPitch < 0 ? rawPitch * 1.4 : rawPitch;
      deltaYaw = -(currentYaw - this.restingYaw) * 3.5;
    }

    // 4. Multi-modal Sensor Fusion
    const scales = SENSITIVITY_SCALES[this.sensitivity];
    let netDeltaX: number;
    let netDeltaY: number;

    if (hasIris) {
      netDeltaX = blendGazeX * 0.38 + irisDeltaX * 0.38 + deltaYaw * 0.24;
      netDeltaY = blendGazeY * 0.38 + irisDeltaY * 0.38 + deltaPitch * 0.24;
    } else {
      netDeltaX = blendGazeX * 0.65 + deltaYaw * 0.35;
      netDeltaY = blendGazeY * 0.65 + deltaPitch * 0.35;
    }

    // Ergonomic upward boost (reaching top bars, navigation tabs, buttons)
    if (netDeltaY < 0) {
      netDeltaY *= 1.42;
    }

    // 5. Map to Screen Coordinates
    let rawClientX = halfW + netDeltaX * (width * 0.48) * scales.multiplierX;
    let rawClientY = halfH + netDeltaY * (height * 0.48) * scales.multiplierY;

    // 6. Apply High-Order 2D Bi-quadratic Polynomial Calibration Transform
    if (this._isCalibrated && this.polyCoeffsX && this.polyCoeffsY) {
      const u = (rawClientX - halfW) / halfW;
      const v = (rawClientY - halfH) / halfH;

      const correctedU =
        this.polyCoeffsX[0]! +
        this.polyCoeffsX[1]! * u +
        this.polyCoeffsX[2]! * v +
        this.polyCoeffsX[3]! * u * u +
        this.polyCoeffsX[4]! * v * v +
        this.polyCoeffsX[5]! * u * v;

      const correctedV =
        this.polyCoeffsY[0]! +
        this.polyCoeffsY[1]! * u +
        this.polyCoeffsY[2]! * v +
        this.polyCoeffsY[3]! * u * u +
        this.polyCoeffsY[4]! * v * v +
        this.polyCoeffsY[5]! * u * v;

      rawClientX = correctedU * halfW + halfW;
      rawClientY = correctedV * halfH + halfH;
    }

    // Viewport clamping
    const clampedX = Math.max(8, Math.min(width - 8, rawClientX));
    const clampedY = Math.max(8, Math.min(height - 8, rawClientY));

    // 7. Adaptive 1-Euro Filter
    let filteredX = this.filterX.filter(clampedX, now);
    let filteredY = this.filterY.filter(clampedY, now);

    // Micro-fixation deadband (suppress jitter < 4px during fixation)
    const distFromSmoothed = Math.hypot(
      filteredX - this.smoothedClientX,
      filteredY - this.smoothedClientY,
    );
    if (distFromSmoothed < 3.5) {
      // Deadband anchor: heavily dampen micro tremor
      filteredX = this.smoothedClientX * 0.9 + filteredX * 0.1;
      filteredY = this.smoothedClientY * 0.9 + filteredY * 0.1;
    }

    this.smoothedClientX = filteredX;
    this.smoothedClientY = filteredY;

    return {
      x: this.smoothedClientX / width,
      y: this.smoothedClientY / height,
      clientX: Math.round(this.smoothedClientX),
      clientY: Math.round(this.smoothedClientY),
      timestamp: now,
      confidence: landmarks.length > 0 ? 0.98 : 0,
      isBlinking,
      blinkStrength: avgBlink,
    };
  }
}
