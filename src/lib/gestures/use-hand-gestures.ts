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
import { getHandLandmarker, drawHandSkeleton } from "./hand-landmarker-wrapper";

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

    setActiveGesture(null);
    setHoldProgress(0);
  }, []);

  const triggerAction = useCallback(
    (action: GestureAction, gesture: HandGesture) => {
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
          const cards = Array.from(
            document.querySelectorAll<HTMLElement>("[data-job-card='true']"),
          );
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
      onAction?.(action, gesture);

      setLastTriggeredGesture(gesture);
      setLastTriggeredAction(action);
      setAnnouncement(`Gesture recognized: ${gestureName} — ${actionName}`);
    },
    [onAction],
  );

  const startDetectionLoop = useCallback(async () => {
    if (typeof window === "undefined" || !videoRef.current) return;

    try {
      setStatus("loading_model");
      const landmarker = await getHandLandmarker();

      setStatus(isPaused ? "paused" : "detecting");
      setErrorMessage(null);

      const loop = () => {
        const video = videoRef.current;
        if (!video || video.paused || video.ended || !streamRef.current) {
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        const now = performance.now();
        const startTimestamp = performance.now();

        if (video.currentTime !== lastVideoTime.current && video.readyState >= 2) {
          lastVideoTime.current = video.currentTime;

          try {
            const results = landmarker.detectForVideo(video, now);
            const duration = performance.now() - startTimestamp;

            // Monitor performance
            if (duration > 120) {
              slowFramesCount.current++;
              if (slowFramesCount.current > 8 && status !== "low_performance") {
                setStatus("low_performance");
              }
            } else {
              slowFramesCount.current = Math.max(0, slowFramesCount.current - 1);
            }

            const handLandmarks = results.landmarks?.[0] as Landmark[] | undefined;

            if (handLandmarks && handLandmarks.length >= 21) {
              // Draw skeleton if canvas is present and preview enabled
              if (canvasRef.current && config.showPreview) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  drawHandSkeleton(ctx, handLandmarks, canvas.width, canvas.height, {
                    isMirrored: true,
                  });
                }
              }

              // Update history for dynamic gesture tracking
              const history = historyRef.current;
              history.push({ landmarks: handLandmarks, timestamp: now });
              // Keep only last 600ms of history
              while (history.length > 0 && now - (history[0]?.timestamp ?? 0) > 600) {
                history.shift();
              }

              const sens = SENSITIVITY_SETTINGS[config.sensitivity];
              const detected = classifyGesture(handLandmarks, history, {
                pinchDistance: sens.pinchDistance,
                swipeThreshold: sens.swipeThreshold,
              });

              const holdState = holdTrackerRef.current.update(detected, now);
              setActiveGesture(holdState.activeGesture);
              setHoldProgress(holdState.progress);

              if (holdState.triggeredGesture && !isPaused) {
                const mappedAction = config.mapping[holdState.triggeredGesture];
                if (mappedAction && mappedAction !== "none") {
                  triggerAction(mappedAction, holdState.triggeredGesture);
                }
              }
            } else {
              // No hand detected
              if (canvasRef.current && config.showPreview) {
                const ctx = canvasRef.current.getContext("2d");
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              }
              const holdState = holdTrackerRef.current.update(null, now);
              setActiveGesture(null);
              setHoldProgress(holdState.progress);
            }
          } catch (detError) {
            console.warn("Hand detection frame error:", detError);
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
  }, [config.sensitivity, config.showPreview, config.mapping, isPaused, status, triggerAction]);

  const initCamera = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setErrorMessage("Camera access is not supported by your browser or environment.");
      return;
    }

    try {
      setStatus("requesting_permission");
      stopCameraStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320, max: 480 },
          height: { ideal: 240, max: 360 },
          frameRate: { ideal: 24, max: 30 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await startDetectionLoop();
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setStatus("permission_denied");
        setErrorMessage(
          "Camera access was denied. To enable hand gesture navigation, allow camera access in your browser settings.",
        );
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setStatus("unavailable");
        setErrorMessage("No webcam or camera device was found on this computer.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setStatus("unavailable");
        setErrorMessage("Camera is currently being used by another application.");
      } else {
        setStatus("unavailable");
        setErrorMessage("Unable to start camera stream. Please verify your camera settings.");
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
