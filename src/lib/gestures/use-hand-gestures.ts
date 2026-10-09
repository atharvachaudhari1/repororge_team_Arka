import { useState, useEffect, useRef, useCallback } from "react";
import type {
  GestureConfig,
  GestureStatus,
  HandGesture,
  GestureAction,
  TimestampedLandmark,
  Landmark,
} from "./types";
import { SENSITIVITY_SETTINGS, ACTION_LABELS, GESTURE_LABELS } from "./types";
import { classifyGesture } from "./classifier";
import { GestureHoldTracker } from "./hold-detector";
import { getHandLandmarker, drawHandSkeleton, smoothLandmarks } from "./hand-landmarker-wrapper";

export type UseHandGesturesOptions = {
  config: GestureConfig;
  onAction?: (action: GestureAction, gesture: HandGesture) => void;
};

export type UseHandGesturesReturn = {
  status: GestureStatus;
  errorMessage: string | null;
  activeGesture: HandGesture | null;
  holdProgress: number;
  lastTriggeredGesture: HandGesture | null;
  lastTriggeredAction: GestureAction | null;
  announcement: string;
  isPaused: boolean;
  togglePause: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stopGestures: () => void;
  restartGestures: () => void;
};

export function useHandGestures({
  config,
  onAction,
}: UseHandGesturesOptions): UseHandGesturesReturn {
  const [status, setStatus] = useState<GestureStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeGesture, setActiveGesture] = useState<HandGesture | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [lastTriggeredGesture, setLastTriggeredGesture] = useState<HandGesture | null>(null);
  const [lastTriggeredAction, setLastTriggeredAction] = useState<GestureAction | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const historyRef = useRef<TimestampedLandmark[]>([]);
  const holdTrackerRef = useRef<GestureHoldTracker>(
    new GestureHoldTracker(config.holdTimeMs, config.cooldownMs),
  );

  const slowFramesCount = useRef(0);
  const lastVideoTime = useRef(-1);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastInferenceTimeRef = useRef(0);
  const lastActiveGestureRef = useRef<HandGesture | null>(null);
  const lastProgressRef = useRef(0);
  const lastProgressUpdateRef = useRef(0);
  const smoothedLandmarksRef = useRef<Landmark[] | null>(null);
  const lastDetectionTimeRef = useRef(0);
  const pinchStartRef = useRef<number | null>(null);
  const airClickCooldownRef = useRef(0);
  const airHoveredElementRef = useRef<HTMLElement | null>(null);

  const configRef = useRef(config);
  configRef.current = config;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const statusRef = useRef(status);
  statusRef.current = status;

  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  // Update holdTracker settings when config changes
  useEffect(() => {
    const sens = SENSITIVITY_SETTINGS[config.sensitivity];
    holdTrackerRef.current.updateConfig(
      config.holdTimeMs || sens.holdTimeMs,
      config.cooldownMs || sens.cooldownMs,
    );
  }, [config.sensitivity, config.holdTimeMs, config.cooldownMs]);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop error
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

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    lastActiveGestureRef.current = null;
    lastProgressRef.current = 0;
    lastInferenceTimeRef.current = 0;
    smoothedLandmarksRef.current = null;
    lastDetectionTimeRef.current = 0;
    pinchStartRef.current = null;
    airClickCooldownRef.current = 0;
    airHoveredElementRef.current = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ableo:air-cursor-hide"));
    }
    setActiveGesture(null);
    setHoldProgress(0);
  }, []);

  const triggerAction = useCallback((action: GestureAction, gesture: HandGesture) => {
    const gestureName = GESTURE_LABELS[gesture]?.name ?? gesture;
    const actionName = ACTION_LABELS[action]?.label ?? action;

    // Handle default browser behaviors
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (action === "pause_gestures") {
      setIsPaused((p) => {
        const next = !p;
        setAnnouncement(
          next ? "Hand gestures paused. Show fist again to resume." : "Hand gestures resumed.",
        );
        return next;
      });
      return;
    }

    if (action === "scroll_down") {
      window.scrollBy({
        top: 350,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    } else if (action === "scroll_up") {
      window.scrollBy({
        top: -350,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    } else if (action === "back") {
      window.history.back();
    } else if (action === "next_job" || action === "previous_job") {
      if (typeof document !== "undefined") {
        const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-job-card='true']"));
        if (cards.length > 0) {
          const currentIndex = cards.findIndex(
            (c) =>
              c.getAttribute("data-active-card") === "true" || c.contains(document.activeElement),
          );
          let nextIndex = 0;
          if (currentIndex !== -1) {
            nextIndex =
              action === "next_job"
                ? (currentIndex + 1) % cards.length
                : (currentIndex - 1 + cards.length) % cards.length;
          }
          cards.forEach((c, idx) => {
            if (idx === nextIndex) {
              c.setAttribute("data-active-card", "true");
              c.scrollIntoView({
                behavior: prefersReducedMotion ? "instant" : "smooth",
                block: "center",
              });
              const link = c.querySelector<HTMLElement>("a, button");
              link?.focus();
            } else {
              c.removeAttribute("data-active-card");
            }
          });
        }
      }
    } else if (action === "select") {
      if (typeof document !== "undefined") {
        const activeCard = document.querySelector<HTMLElement>(
          "[data-job-card='true'][data-active-card='true']",
        );
        if (activeCard) {
          const link = activeCard.querySelector<HTMLAnchorElement>("a[href*='/jobs/']");
          link?.click();
        }
      }
    } else if (action === "save_job") {
      if (typeof document !== "undefined") {
        const activeCard = document.querySelector<HTMLElement>(
          "[data-job-card='true'][data-active-card='true']",
        );
        if (activeCard) {
          const saveBtn = activeCard.querySelector<HTMLButtonElement>(
            "button[aria-label*='bookmark' i], button[aria-label*='save' i], button:has(svg.lucide-bookmark)",
          );
          saveBtn?.click();
        }
      }
    }

    // Dispatch global DOM event for components like Job Listings or Wizards to consume
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ableo:gesture-action", {
          detail: { action, gesture },
        }),
      );
    }

    // Call consumer callback
    onActionRef.current?.(action, gesture);

    setLastTriggeredGesture(gesture);
    setLastTriggeredAction(action);
    setAnnouncement(`Gesture recognized: ${gestureName} — ${actionName}`);
  }, []);

  const startDetectionLoop = useCallback(async () => {
    if (typeof window === "undefined" || !videoRef.current) return;

    try {
      setStatus("loading_model");
      const landmarker = await getHandLandmarker();

      setStatus(isPausedRef.current ? "paused" : "detecting");
      setErrorMessage(null);

      const loop = () => {
        const video = videoRef.current;
        if (!video || video.paused || video.ended || !streamRef.current) {
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        const now = performance.now();

        // 1. Direct GPU Neural Inference: Throttled to ~20 FPS (every 45-50ms) on new video frames
        if (
          video.readyState >= 2 &&
          video.currentTime > 0 &&
          video.currentTime !== lastVideoTime.current &&
          now - lastInferenceTimeRef.current >= 45
        ) {
          lastVideoTime.current = video.currentTime;
          lastInferenceTimeRef.current = now;
          const startTimestamp = performance.now();

          try {
            // Direct hardware texture inference — avoids software 2D canvas readback lag
            const results = landmarker.detectForVideo(video, now);
            const duration = performance.now() - startTimestamp;

            // Monitor performance
            if (duration > 90) {
              slowFramesCount.current++;
              if (slowFramesCount.current > 12 && statusRef.current !== "low_performance") {
                setStatus("low_performance");
              }
            } else {
              slowFramesCount.current = Math.max(0, slowFramesCount.current - 1);
            }

            const handLandmarks = results.landmarks?.[0] as Landmark[] | undefined;

            if (handLandmarks && handLandmarks.length >= 21) {
              lastDetectionTimeRef.current = now;

              // Smooth landmarks across frames to eliminate micro-jitter and fluttering (alpha = 0.35)
              const smoothed = smoothLandmarks(handLandmarks, smoothedLandmarksRef.current, 0.35);
              smoothedLandmarksRef.current = smoothed;
              const sens = SENSITIVITY_SETTINGS[configRef.current.sensitivity];

              if (configRef.current.airCursorEnabled && !isPausedRef.current) {
                const indexTip = smoothed[8];
                const thumbTip = smoothed[4];
                if (indexTip && thumbTip) {
                  const x = Math.max(
                    0,
                    Math.min(window.innerWidth, (1 - indexTip.x) * window.innerWidth),
                  );
                  const y = Math.max(
                    0,
                    Math.min(window.innerHeight, indexTip.y * window.innerHeight),
                  );
                  const pinchDistance = Math.hypot(
                    indexTip.x - thumbTip.x,
                    indexTip.y - thumbTip.y,
                  );
                  const pinching = pinchDistance <= sens.pinchDistance;

                  window.dispatchEvent(
                    new CustomEvent("ableo:air-cursor-move", {
                      detail: { x, y, pinching },
                    }),
                  );

                  const target = document.elementFromPoint(x, y) as HTMLElement | null;
                  if (target !== airHoveredElementRef.current) {
                    airHoveredElementRef.current?.dispatchEvent(
                      new MouseEvent("mouseout", { bubbles: true, clientX: x, clientY: y }),
                    );
                    target?.dispatchEvent(
                      new MouseEvent("mouseover", { bubbles: true, clientX: x, clientY: y }),
                    );
                    airHoveredElementRef.current = target;
                  }
                  target?.dispatchEvent(
                    new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }),
                  );

                  if (pinching) {
                    pinchStartRef.current ??= now;
                    if (now - pinchStartRef.current >= 280 && now >= airClickCooldownRef.current) {
                      target?.click();
                      airClickCooldownRef.current = now + 850;
                      pinchStartRef.current = now;
                      window.dispatchEvent(
                        new CustomEvent("ableo:air-cursor-click", { detail: { x, y } }),
                      );
                    }
                  } else {
                    pinchStartRef.current = null;
                  }
                }
              }

              // Update history for dynamic gesture tracking
              const history = historyRef.current;
              history.push({ landmarks: smoothed, timestamp: now });
              while (history.length > 0 && now - (history[0]?.timestamp ?? 0) > 600) {
                history.shift();
              }

              const detected = classifyGesture(smoothed, history, {
                pinchDistance: sens.pinchDistance,
                swipeThreshold: sens.swipeThreshold,
              });

              const holdState = holdTrackerRef.current.update(detected, now);

              // React Render Optimization: Only update activeGesture when it actually changes
              if (lastActiveGestureRef.current !== holdState.activeGesture) {
                lastActiveGestureRef.current = holdState.activeGesture;
                setActiveGesture(holdState.activeGesture);
              }

              // React Render Optimization: Throttle progress state to 5% increments or completion
              const roundedProgress = Math.round(holdState.progress * 20) / 20;
              if (
                roundedProgress !== lastProgressRef.current &&
                (now - lastProgressUpdateRef.current > 75 ||
                  roundedProgress === 0 ||
                  roundedProgress === 1)
              ) {
                lastProgressRef.current = roundedProgress;
                lastProgressUpdateRef.current = now;
                setHoldProgress(roundedProgress);
              }

              if (holdState.triggeredGesture && !isPausedRef.current) {
                const mappedAction = configRef.current.mapping[holdState.triggeredGesture];
                if (mappedAction && mappedAction !== "none") {
                  triggerAction(mappedAction, holdState.triggeredGesture);
                }
              }
            } else {
              // No hand detected in this inference frame
              // Grace window: retain skeleton for 400ms to prevent single-frame fluttering
              if (now - lastDetectionTimeRef.current > 400) {
                pinchStartRef.current = null;
                airHoveredElementRef.current = null;
                window.dispatchEvent(new CustomEvent("ableo:air-cursor-hide"));
                smoothedLandmarksRef.current = null;
                holdTrackerRef.current.update(null, now);

                if (lastActiveGestureRef.current !== null) {
                  lastActiveGestureRef.current = null;
                  setActiveGesture(null);
                }

                if (lastProgressRef.current !== 0) {
                  lastProgressRef.current = 0;
                  setHoldProgress(0);
                }
              }
            }
          } catch (detError) {
            console.warn("Hand detection frame error:", detError);
          }
        }

        // 2. High-Framerate Canvas Preview: Renders at display rate (30-60 FPS)
        // Decoupled from AI inference to keep camera feed and skeleton silky smooth and flutter-free
        if (canvasRef.current && configRef.current.showPreview) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const timeSinceDetection = now - lastDetectionTimeRef.current;
            let opacity = 0;
            if (smoothedLandmarksRef.current) {
              if (timeSinceDetection < 300) {
                opacity = 1.0; // Solid unwavering visibility while tracked
              } else if (timeSinceDetection < 500) {
                opacity = Math.max(0, 1.0 - (timeSinceDetection - 300) / 200); // Smooth gentle fade-out
              }
            }

            drawHandSkeleton(
              ctx,
              opacity > 0 ? smoothedLandmarksRef.current : null,
              canvas.width,
              canvas.height,
              {
                isMirrored: true,
                opacity,
              },
            );
          }
        }

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } catch (modelErr) {
      console.error("Failed to initialize HandLandmarker:", modelErr);
      setStatus("unavailable");
      setErrorMessage(
        "Could not load gesture detection model. Please check your internet connection.",
      );
    }
  }, [triggerAction]);

  const initCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setErrorMessage(
        typeof window !== "undefined" && !window.isSecureContext
          ? "Camera access requires a secure connection (HTTPS or localhost)."
          : "Camera access is not supported by your browser or environment.",
      );
      return;
    }

    try {
      setStatus("requesting_permission");
      stopCameraStream();

      // Multi-stage progressive constraint fallback:
      // 1. Ideal front-facing 640x480 (standard aspect ratio)
      // 2. Relaxed 640x480 without facingMode constraint (supports external USB webcams & Continuity Camera)
      // 3. Permissive generic video fallback (supports all hardware)
      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
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
          // If permission is denied or blocked by security, fail immediately rather than cycling constraints
          if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError" ||
            error.name === "SecurityError"
          ) {
            throw err;
          }
          console.warn(
            "Retrying camera with relaxed constraints due to:",
            error.name,
            error.message,
          );
        }
      }

      if (!stream) {
        throw lastError ?? new Error("Could not acquire media stream.");
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("muted", "true");
        video.srcObject = stream;

        // Ensure video metadata is loaded before attempting playback
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

        try {
          await video.play();
        } catch (playErr) {
          console.warn("Non-fatal video.play() warning:", playErr);
        }
      }

      await startDetectionLoop();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Camera initialization failed:", {
        name: error?.name,
        message: error?.message,
      });

      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setStatus("permission_denied");
        setErrorMessage(
          "Camera access was denied. Check the camera icon/lock in your browser address bar or macOS System Settings -> Privacy & Security -> Camera.",
        );
      } else if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        setStatus("unavailable");
        setErrorMessage(
          "No webcam or camera device was found on this computer. Please connect a camera and try again.",
        );
      } else if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
        setStatus("unavailable");
        setErrorMessage(
          "Camera is currently in use by another app (e.g. FaceTime, Zoom, Google Meet) or blocked by system security.",
        );
      } else if (error?.name === "OverconstrainedError") {
        setStatus("unavailable");
        setErrorMessage(
          "Camera resolution constraints could not be satisfied. Click 'Retry' to use default settings.",
        );
      } else if (error?.name === "SecurityError") {
        setStatus("unavailable");
        setErrorMessage("Camera access requires a secure connection (HTTPS or localhost).");
      } else if (error?.name === "AbortError") {
        setStatus("unavailable");
        setErrorMessage(
          "Camera initialization was interrupted. Click 'Retry Camera' to try again.",
        );
      } else {
        setStatus("unavailable");
        setErrorMessage(
          `Unable to start camera stream: ${error?.message || "Check camera permissions and try again."}`,
        );
      }
    }
  }, [startDetectionLoop, stopCameraStream]);

  // Main lifecycle: activate camera only when config.enabled is true
  useEffect(() => {
    if (!config.enabled) {
      stopCameraStream();
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    initCamera();

    return () => {
      stopCameraStream();
    };
  }, [config.enabled, initCamera, stopCameraStream]);

  // Tab visibility management: immediately pause stream when tab hidden to respect privacy & battery
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCameraStream();
        if (config.enabled) {
          setStatus("paused");
        }
      } else if (config.enabled) {
        initCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [config.enabled, initCamera, stopCameraStream]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => {
      const next = !p;
      setAnnouncement(
        next ? "Hand gesture navigation paused." : "Hand gesture navigation resumed.",
      );
      return next;
    });
  }, []);

  const stopGestures = useCallback(() => {
    stopCameraStream();
    setStatus("idle");
    setAnnouncement("Hand gesture navigation turned off.");
  }, [stopCameraStream]);

  const restartGestures = useCallback(() => {
    if (config.enabled) {
      initCamera();
    }
  }, [config.enabled, initCamera]);

  return {
    status,
    errorMessage,
    activeGesture,
    holdProgress,
    lastTriggeredGesture,
    lastTriggeredAction,
    announcement,
    isPaused,
    togglePause,
    videoRef,
    canvasRef,
    stopGestures,
    restartGestures,
  };
}
