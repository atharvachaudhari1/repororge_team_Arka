type TasksVision = typeof import("@mediapipe/tasks-vision");

export type FaceLandmark = {
  x: number;
  y: number;
  z?: number;
};

// Key landmarks for eye & iris tracking
export const LEFT_EYE_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
export const RIGHT_EYE_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
export const LEFT_EYEBROW = [70, 63, 105, 66, 107];
export const RIGHT_EYEBROW = [336, 296, 334, 293, 300];
export const LEFT_IRIS_CENTER = 468;
export const RIGHT_IRIS_CENTER = 473;
export const LEFT_IRIS_RING = [469, 470, 471, 472];
export const RIGHT_IRIS_RING = [474, 475, 476, 477];

let landmarkerInstance: import("@mediapipe/tasks-vision").FaceLandmarker | null = null;
let isLoading = false;
let loadPromise: Promise<import("@mediapipe/tasks-vision").FaceLandmarker> | null = null;

/**
 * Lazy loads and initializes the MediaPipe FaceLandmarker singleton.
 * Runs 100% in browser WebAssembly with hardware GPU acceleration and fallback to CPU.
 * No camera frames or face telemetry ever leave the client.
 */
export async function getFaceLandmarker(): Promise<
  import("@mediapipe/tasks-vision").FaceLandmarker
> {
  if (typeof window === "undefined") {
    throw new Error("FaceLandmarker can only be loaded in browser environment");
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

      let wasmFileset;
      try {
        // Match the exact installed 1.0.1 version first
        wasmFileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
        );
      } catch (e1) {
        console.warn("WASM resolver 1.0.1 failed, trying 0.10.21 fallback:", e1);
        wasmFileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",
        );
      }

      const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

      try {
        // Try hardware-accelerated GPU delegate first
        landmarkerInstance = await vision.FaceLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });
      } catch (gpuError) {
        console.warn("GPU delegate initialization failed for FaceLandmarker, falling back to CPU:", gpuError);
        // Fallback to CPU delegate on unsupported GPU environments
        landmarkerInstance = await vision.FaceLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
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

export function isFaceLandmarkerLoading(): boolean {
  return isLoading;
}

export function releaseFaceLandmarker() {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close();
    } catch {
      // Ignore close error
    }
    landmarkerInstance = null;
    loadPromise = null;
    isLoading = false;
  }
}

/**
 * Draws eye contours, iris positions, and tracking crosshairs on the preview canvas.
 */
export function drawEyeGazeSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmark[] | null,
  canvasWidth: number,
  canvasHeight: number,
  options: {
    isMirrored?: boolean;
    isBlinking?: boolean;
    video?: HTMLVideoElement | null;
  } = {},
): void {
  const isMirrored = options.isMirrored ?? true;
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!landmarks || landmarks.length < 468) {
    ctx.restore();
    return;
  }

  const toCoord = (pt: FaceLandmark) => ({
    x: isMirrored ? (1 - pt.x) * canvasWidth : pt.x * canvasWidth,
    y: pt.y * canvasHeight,
  });

  const drawLoop = (indices: number[], strokeColor: string, lineWidth = 1.5) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    indices.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (!pt) return;
      const { x, y } = toCoord(pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  };

  const drawLine = (indices: number[], strokeColor: string, lineWidth = 1.5) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    indices.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (!pt) return;
      const { x, y } = toCoord(pt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  // 1. Draw subtle eyebrows
  drawLine(LEFT_EYEBROW, "rgba(255, 255, 255, 0.45)", 1.5);
  drawLine(RIGHT_EYEBROW, "rgba(255, 255, 255, 0.45)", 1.5);

  // 2. Draw eye contours (Emerald/Cyan neon outline)
  drawLoop(LEFT_EYE_CONTOUR, "#10b981", 1.8);
  drawLoop(RIGHT_EYE_CONTOUR, "#10b981", 1.8);

  // 3. Draw Iris Rings & Centers if available (landmarks 468-477)
  if (landmarks.length >= 478) {
    const leftIris = landmarks[LEFT_IRIS_CENTER];
    const rightIris = landmarks[RIGHT_IRIS_CENTER];

    if (leftIris) {
      const { x, y } = toCoord(leftIris);
      // Iris outer glow
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(14, 165, 233, 0.25)";
      ctx.fill();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Iris center pupil dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (rightIris) {
      const { x, y } = toCoord(rightIris);
      // Iris outer glow
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(14, 165, 233, 0.25)";
      ctx.fill();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Iris center pupil dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // 4. If blinking, draw visual indicator
  if (options.isBlinking) {
    ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("BLINK", 8, canvasHeight - 10);
  }

  ctx.restore();
}
