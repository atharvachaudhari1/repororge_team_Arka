import type { Landmark } from "./types";

// Standard bone connection pairs for 21-point hand skeleton
export const HAND_CONNECTIONS: [number, number][] = [
  // Wrist to finger bases
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
  // Palm connections
  [5, 9],
  [9, 13],
  [13, 17],
];

type TasksVision = typeof import("@mediapipe/tasks-vision");

let landmarkerInstance: import("@mediapipe/tasks-vision").HandLandmarker | null = null;
let isLoading = false;
let loadPromise: Promise<import("@mediapipe/tasks-vision").HandLandmarker> | null = null;

/**
 * Lazy loads and initializes the MediaPipe HandLandmarker client-side singleton.
 * Runs 100% in browser WebAssembly — no frames or video are ever transmitted.
 */
export async function getHandLandmarker(): Promise<
  import("@mediapipe/tasks-vision").HandLandmarker
> {
  if (typeof window === "undefined") {
    throw new Error("HandLandmarker can only be loaded in browser environment");
  }

  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = (async () => {
    try {
      const vision: TasksVision = await import("@mediapipe/tasks-vision");
      const wasmFileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

      try {
        // Try hardware-accelerated GPU delegate first
        landmarkerInstance = await vision.HandLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      } catch (gpuError) {
        console.warn("GPU delegate initialization failed, falling back to CPU:", gpuError);
        // Fallback to CPU delegate on unsupported GPUs or headless drivers
        landmarkerInstance = await vision.HandLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      }

      isLoading = false;
      return landmarkerInstance;
    } catch (err) {
      isLoading = false;
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

/**
 * Checks if the HandLandmarker is currently loading.
 */
export function isHandLandmarkerLoading(): boolean {
  return isLoading;
}

/**
 * Releases the HandLandmarker instance and frees memory.
 */
export function releaseHandLandmarker(): void {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close();
    } catch {
      // Ignore cleanup error
    }
    landmarkerInstance = null;
  }
  loadPromise = null;
  isLoading = false;
}

/**
 * Smooths landmark coordinates across frames using Exponential Moving Average (EMA).
 * Eliminates micro-jitter, high-frequency camera noise, and bone fluttering.
 */
export function smoothLandmarks(
  current: Landmark[],
  previous: Landmark[] | null,
  alpha = 0.6,
): Landmark[] {
  if (!previous || previous.length !== current.length) {
    return current;
  }

  return current.map((pt, i) => {
    const prev = previous[i];
    if (!prev) return pt;
    return {
      x: prev.x * (1 - alpha) + pt.x * alpha,
      y: prev.y * (1 - alpha) + pt.y * alpha,
      z: (prev.z ?? 0) * (1 - alpha) + (pt.z ?? 0) * alpha,
    };
  });
}

/**
 * Utility to render live camera video and high-contrast hand skeleton onto an HTML5 canvas.
 * Prevents black box flickering and stabilizes skeleton drawing with optional opacity.
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[] | null,
  canvasWidth: number,
  canvasHeight: number,
  options: {
    lineColor?: string;
    pointColor?: string;
    tipColor?: string;
    isMirrored?: boolean;
    video?: HTMLVideoElement | null;
    opacity?: number;
  } = {},
): void {
  const lineColor = options.lineColor ?? "#10b981"; // emerald-500
  const pointColor = options.pointColor ?? "#ffffff";
  const tipColor = options.tipColor ?? "#38bdf8"; // sky-400
  const isMirrored = options.isMirrored ?? true;
  const opacity = options.opacity ?? 1.0;
  const video = options.video;

  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Draw live camera video feed if available
  if (video && video.readyState >= 2) {
    ctx.save();
    if (isMirrored) {
      ctx.translate(canvasWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

    // Subtle dark tint so the bright skeleton lines pop clearly over any background
    ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  } else {
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (!landmarks || landmarks.length < 21) {
    ctx.restore();
    return;
  }

  ctx.globalAlpha = opacity;

  const getCanvasCoord = (pt: Landmark) => {
    const x = isMirrored ? (1 - pt.x) * canvasWidth : pt.x * canvasWidth;
    const y = pt.y * canvasHeight;
    return { x, y };
  };

  // 2. Draw connection bones with glowing outline
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = lineColor;
  ctx.shadowBlur = 6;

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (!start || !end) continue;

    const p1 = getCanvasCoord(start);
    const p2 = getCanvasCoord(end);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 3. Draw landmark joints
  ctx.shadowBlur = 0; // reset shadow for sharp joint circles
  const tipIndices = new Set([4, 8, 12, 16, 20]);

  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    if (!pt) continue;

    const coord = getCanvasCoord(pt);
    const isTip = tipIndices.has(i);

    ctx.fillStyle = isTip ? tipColor : pointColor;
    ctx.beginPath();
    ctx.arc(coord.x, coord.y, isTip ? 4 : 2.5, 0, 2 * Math.PI);
    ctx.fill();

    // Outline for crisp contrast
    ctx.strokeStyle = isTip ? "#ffffff" : lineColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.restore();
}
