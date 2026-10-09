import { useState, useEffect, useRef, useCallback } from "react";
import type {
  EyeTrackingConfig,
  EyeTrackingStatus,
  GazePoint,
  CalibrationMode,
  CalibrationSample,
  CalibrationMetrics,
} from "./types";
import { getFaceLandmarker, drawEyeGazeSkeleton } from "./face-landmarker-wrapper";
import { GazeEngine } from "./gaze-engine";

export type { CalibrationSample, CalibrationMetrics, CalibrationMode };

export type UseEyeTrackingOptions = {
  config: EyeTrackingConfig;
  onGazeClick?: (element: HTMLElement, x: number, y: number) => void;
};

export type UseEyeTrackingReturn = {
  status: EyeTrackingStatus;
  errorMessage: string | null;
  gazePoint: GazePoint | null;
  dwellProgress: number; // 0 to 1
  dwellElementLabel: string | null;
  lastClickTime: number;
  isPaused: boolean;
  isCalibrated: boolean;
  calibrationMetrics: CalibrationMetrics | null;
  togglePause: () => void;
  restartEyeTracking: () => void;
  recalibrate: () => void;
  resetCalibration: () => void;
  startCalibration: () => void;
  applyCalibration: (samples: CalibrationSample[], mode?: CalibrationMode) => void;
  cancelCalibration: () => void;
  isCalibrating: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
};

function playClickSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Audio context may be restricted
  }
}

export function useEyeTracking({
  config,
  onGazeClick,
}: UseEyeTrackingOptions): UseEyeTrackingReturn {
  const [status, setStatus] = useState<EyeTrackingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gazePoint, setGazePoint] = useState<GazePoint | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [dwellElementLabel, setDwellElementLabel] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [restartCounter, setRestartCounter] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const gazeEngineRef = useRef<GazeEngine>(
    new GazeEngine(config.smoothingFactor, config.sensitivity),
  );
  const [isCalibrated, setIsCalibrated] = useState(() => gazeEngineRef.current.isCalibrated);
  const [calibrationMetrics, setCalibrationMetrics] = useState<CalibrationMetrics | null>(
    () => gazeEngineRef.current.metrics,
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stabilize callbacks and configs with refs to prevent camera teardown on re-renders
  const onGazeClickRef = useRef(onGazeClick);
  useEffect(() => {
    onGazeClickRef.current = onGazeClick;
  }, [onGazeClick]);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
    gazeEngineRef.current.updateConfig(config.smoothingFactor, config.sensitivity);
  }, [config]);

  // Dwell state
  const dwellAnchorRef = useRef<{ x: number; y: number; startTime: number } | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const blinkStartRef = useRef<number | null>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const dwellProgressRef = useRef(0);
  const dwellElementLabelRef = useRef<string | null>(null);
  const lastStateUpdateTimeRef = useRef<number>(0);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const restartEyeTracking = useCallback(() => {
    setRestartCounter((c) => c + 1);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setGazePoint(null);
    setDwellProgress(0);
    setDwellElementLabel(null);
  }, []);

  const recalibrate = useCallback(() => {
    gazeEngineRef.current.recalibrate();
  }, []);

  const resetCalibration = useCallback(() => {
    gazeEngineRef.current.resetCalibration();
    setIsCalibrated(false);
    setCalibrationMetrics(null);
  }, []);

  const startCalibration = useCallback(() => {
    // Clear existing correction so we collect raw (uncorrected) samples
    gazeEngineRef.current.clearCalibrationCorrection();
    setIsCalibrated(false);
    setCalibrationMetrics(null);
    setIsCalibrating(true);
  }, []);

  const applyCalibration = useCallback(
    (samples: CalibrationSample[], mode: CalibrationMode = "9-point") => {
      const metrics = gazeEngineRef.current.applyCalibrationData(samples, mode);
      setIsCalibrated(gazeEngineRef.current.isCalibrated);
      setCalibrationMetrics(metrics);
      setIsCalibrating(false);
    },
    [],
  );

  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false);
  }, []);

  // Main camera & landmarker processing loop
  useEffect(() => {
    if (!config.enabled) {
      stopStream();
      setStatus("idle");
      return;
    }

    let isMounted = true;
    setStatus("requesting_permission");
    setErrorMessage(null);

    async function initEyeTracking() {
      try {
        if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API (getUserMedia) is not supported in this browser.");
        }

        const attempts: MediaStreamConstraints[] = [
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
              frameRate: { ideal: 30, max: 30 },
            },
            audio: false,
          },
          {
            video: {
              facingMode: "user",
            },
            audio: false,
          },
          {
            video: true,
            audio: false,
          },
        ];

        let stream: MediaStream | null = null;
        let lastError: unknown = null;

        for (const constraints of attempts) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (stream) break;
          } catch (err: unknown) {
            lastError = err;
            const error = err as Error;
            if (
              error.name === "NotAllowedError" ||
              error.name === "PermissionDeniedError" ||
              error.name === "SecurityError"
            ) {
              throw err;
            }
          }
        }

        if (!stream) {
          throw lastError ?? new Error("Could not acquire webcam stream.");
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setStatus("initializing");

        const video = videoRef.current;
        if (video) {
          video.muted = true;
          video.playsInline = true;
          video.setAttribute("playsinline", "true");
          video.setAttribute("muted", "true");
          video.srcObject = stream;

          // Non-blocking metadata wait with strict 1200ms timeout safeguard
          await new Promise<void>((resolve) => {
            if (video.readyState >= 1) {
              resolve();
            } else {
              const onLoaded = () => {
                video.removeEventListener("loadedmetadata", onLoaded);
                resolve();
              };
              video.addEventListener("loadedmetadata", onLoaded);
              setTimeout(() => {
                video.removeEventListener("loadedmetadata", onLoaded);
                resolve();
              }, 1200);
            }
          });

          await video.play().catch((playErr) => {
            console.warn("Eye tracking video play caught:", playErr);
          });
        }

        if (!isMounted) return;

        setStatus("loading_model");
        const landmarker = await Promise.race([
          getFaceLandmarker(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "Face Landmarker model initialization timed out. Please check network connection.",
                  ),
                ),
              20000,
            ),
          ),
        ]);

        if (!isMounted) return;

        setStatus("tracking");

        let lastVideoTime = -1;

        const processFrame = () => {
          if (!isMounted || !videoRef.current) return;

          const activeVideo = videoRef.current;
          if (activeVideo.readyState >= 2 && activeVideo.currentTime !== lastVideoTime) {
            lastVideoTime = activeVideo.currentTime;
            const now = performance.now();

            try {
              const result = landmarker.detectForVideo(activeVideo, now);
              const landmarks = result.faceLandmarks?.[0];
              const blendshapes = result.faceBlendshapes?.[0]?.categories;

              if (landmarks && landmarks.length > 0) {
                const currentGaze = gazeEngineRef.current.estimateGaze(landmarks, blendshapes);

                // Render real-time eye contours & iris tracking on preview canvas
                if (canvasRef.current) {
                  const canvas = canvasRef.current;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    drawEyeGazeSkeleton(ctx, landmarks, canvas.width, canvas.height, {
                      isMirrored: true,
                      isBlinking: currentGaze.isBlinking,
                    });
                  }
                }

                if (!isPausedRef.current) {
                  const cfg = configRef.current;

                  // Throttle React gazePoint state updates to 20ms to prevent component thrashing
                  if (now - lastStateUpdateTimeRef.current >= 20) {
                    lastStateUpdateTimeRef.current = now;
                    setGazePoint(currentGaze);
                  }

                  // --- 1. Edge-Scrolling Logic ---
                  if (cfg.edgeScrollEnabled && typeof window !== "undefined") {
                    const edgeThresholdY = window.innerHeight * 0.12;
                    if (currentGaze.clientY < edgeThresholdY) {
                      window.scrollBy({ top: -14, behavior: "instant" });
                    } else if (currentGaze.clientY > window.innerHeight - edgeThresholdY) {
                      window.scrollBy({ top: 14, behavior: "instant" });
                    }
                  }

                  // --- 2. Element Dwell & Target Detection ---
                  if (now > cooldownUntilRef.current) {
                    const targetEl = document.elementFromPoint(
                      currentGaze.clientX,
                      currentGaze.clientY,
                    ) as HTMLElement | null;

                    // Find interactive clickable parent
                    const clickable = targetEl?.closest<HTMLElement>(
                      "button, a, input, select, textarea, [role='button'], [tabindex='0'], [data-job-card='true']",
                    );

                    const label = clickable
                      ? clickable.getAttribute("aria-label") ||
                        clickable.innerText?.slice(0, 30) ||
                        clickable.tagName.toLowerCase()
                      : null;

                    if (dwellElementLabelRef.current !== label) {
                      dwellElementLabelRef.current = label;
                      setDwellElementLabel(label);
                    }

                    // Check dwell stability
                    if (!dwellAnchorRef.current) {
                      dwellAnchorRef.current = {
                        x: currentGaze.clientX,
                        y: currentGaze.clientY,
                        startTime: now,
                      };
                    } else {
                      const dist = Math.hypot(
                        currentGaze.clientX - dwellAnchorRef.current.x,
                        currentGaze.clientY - dwellAnchorRef.current.y,
                      );

                      if (dist > cfg.dwellRadiusPx) {
                        // Gaze shifted away, reset anchor
                        dwellAnchorRef.current = {
                          x: currentGaze.clientX,
                          y: currentGaze.clientY,
                          startTime: now,
                        };
                        if (dwellProgressRef.current !== 0) {
                          dwellProgressRef.current = 0;
                          setDwellProgress(0);
                        }
                      } else {
                        const elapsed = now - dwellAnchorRef.current.startTime;
                        const progress = Math.min(1, elapsed / cfg.dwellTimeMs);

                        if (
                          Math.abs(dwellProgressRef.current - progress) >= 0.02 ||
                          (progress === 1 && dwellProgressRef.current !== 1) ||
                          (progress === 0 && dwellProgressRef.current !== 0)
                        ) {
                          dwellProgressRef.current = progress;
                          setDwellProgress(progress);
                        }

                        // Dwell Click Triggered!
                        if (
                          progress >= 1 &&
                          (cfg.clickMode === "dwell" || cfg.clickMode === "both")
                        ) {
                          const elemToClick = clickable || targetEl;
                          if (elemToClick) {
                            elemToClick.click();
                            playClickSound();
                            onGazeClickRef.current?.(
                              elemToClick,
                              currentGaze.clientX,
                              currentGaze.clientY,
                            );
                          }
                          setLastClickTime(now);
                          dwellProgressRef.current = 0;
                          setDwellProgress(0);
                          dwellAnchorRef.current = null;
                          cooldownUntilRef.current = now + 750; // Prevent rapid reclicks
                        }
                      }
                    }

                    // --- 3. Deliberate Blink Click Trigger ---
                    if (cfg.clickMode === "blink" || cfg.clickMode === "both") {
                      if (currentGaze.isBlinking) {
                        if (!blinkStartRef.current) {
                          blinkStartRef.current = now;
                        } else if (
                          now - blinkStartRef.current >= 300 &&
                          now - blinkStartRef.current <= 900
                        ) {
                          // Intentional blink held between 300ms and 900ms
                          const elemToClick = clickable || targetEl;
                          if (elemToClick) {
                            elemToClick.click();
                            playClickSound();
                            onGazeClickRef.current?.(
                              elemToClick,
                              currentGaze.clientX,
                              currentGaze.clientY,
                            );
                          }
                          setLastClickTime(now);
                          blinkStartRef.current = null;
                          cooldownUntilRef.current = now + 900;
                        }
                      } else {
                        blinkStartRef.current = null;
                      }
                    }
                  } else {
                    if (dwellProgressRef.current !== 0) {
                      dwellProgressRef.current = 0;
                      setDwellProgress(0);
                    }
                  }
                }
              } else {
                // Clear skeleton when face is lost
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext("2d");
                  ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
              }
            } catch (err) {
              console.warn("Eye tracking detection tick note:", err);
            }
          }

          animFrameRef.current = requestAnimationFrame(processFrame);
        };

        animFrameRef.current = requestAnimationFrame(processFrame);
      } catch (err: unknown) {
        if (!isMounted) return;
        setStatus("error");
        const error = err as Error;
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError" ||
          error.name === "SecurityError"
        ) {
          setErrorMessage(
            "Camera permission was blocked. Please allow camera access in your browser to use Eye Tracking.",
          );
        } else {
          setErrorMessage(
            error.message ||
              "Camera or eye tracking model failed to initialize. Please check permissions and connection.",
          );
        }
      }
    }

    initEyeTracking();

    return () => {
      isMounted = false;
      stopStream();
    };
  }, [config.enabled, restartCounter, stopStream]);

  return {
    status,
    errorMessage,
    gazePoint,
    dwellProgress,
    dwellElementLabel,
    lastClickTime,
    isPaused,
    isCalibrated,
    calibrationMetrics,
    togglePause,
    restartEyeTracking,
    recalibrate,
    resetCalibration,
    startCalibration,
    applyCalibration,
    cancelCalibration,
    isCalibrating,
    videoRef,
    canvasRef,
  };
}
