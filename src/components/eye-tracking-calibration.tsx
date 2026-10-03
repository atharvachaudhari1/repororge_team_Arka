import { useEffect, useRef, useState, useCallback } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { GazePoint, CalibrationSample } from "@/lib/eye-tracking";

/**
 * 5-point calibration targets arranged in a cross pattern.
 * Positions are fractions of viewport width/height.
 */
const CALIBRATION_POINTS = [
  { fx: 0.5, fy: 0.5, label: "Center" },
  { fx: 0.5, fy: 0.12, label: "Top" },
  { fx: 0.88, fy: 0.5, label: "Right" },
  { fx: 0.5, fy: 0.88, label: "Bottom" },
  { fx: 0.12, fy: 0.5, label: "Left" },
];

// Timing per point
const SETTLE_MS = 800; // initial stabilisation (samples discarded)
const COLLECT_MS = 1700; // sample collection window
const POINT_TOTAL_MS = SETTLE_MS + COLLECT_MS;
const SUCCESS_DISPLAY_MS = 1200; // "Done!" message before closing

type Props = {
  gazePoint: GazePoint | null;
  onComplete: (samples: CalibrationSample[]) => void;
  onCancel: () => void;
};

export function EyeTrackingCalibration({ gazePoint, onComplete, onCancel }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<"settle" | "collect" | "done">("settle");
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const gazeRef = useRef(gazePoint);
  gazeRef.current = gazePoint;

  const samplesPerPoint = useRef<Array<{ sumX: number; sumY: number; count: number }>>(
    CALIBRATION_POINTS.map(() => ({ sumX: 0, sumY: 0, count: 0 })),
  );

  const phaseStartRef = useRef(performance.now());
  const animRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishCalibration = useCallback(() => {
    // Build averaged samples
    const result: CalibrationSample[] = [];
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;

    for (let i = 0; i < CALIBRATION_POINTS.length; i++) {
      const pt = CALIBRATION_POINTS[i]!;
      const acc = samplesPerPoint.current[i]!;
      if (acc.count > 0) {
        result.push({
          targetX: pt.fx * w,
          targetY: pt.fy * h,
          measuredX: acc.sumX / acc.count,
          measuredY: acc.sumY / acc.count,
        });
      }
    }

    setShowSuccess(true);
    setTimeout(() => {
      onCompleteRef.current(result);
    }, SUCCESS_DISPLAY_MS);
  }, []);

  // Main animation loop for timing and sample collection
  useEffect(() => {
    phaseStartRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = now - phaseStartRef.current;

      if (phase === "settle") {
        setProgress(0);
        if (elapsed >= SETTLE_MS) {
          setPhase("collect");
          phaseStartRef.current = now;
        }
      } else if (phase === "collect") {
        const p = Math.min(1, elapsed / COLLECT_MS);
        setProgress(p);

        // Collect gaze sample
        const gp = gazeRef.current;
        if (gp && gp.confidence > 0) {
          const acc = samplesPerPoint.current[currentIdx]!;
          acc.sumX += gp.clientX;
          acc.sumY += gp.clientY;
          acc.count++;
        }

        if (elapsed >= COLLECT_MS) {
          // Move to next point or finish
          const nextIdx = currentIdx + 1;
          if (nextIdx >= CALIBRATION_POINTS.length) {
            finishCalibration();
            return; // Stop the loop
          } else {
            setCurrentIdx(nextIdx);
            setPhase("settle");
            phaseStartRef.current = now;
          }
        }
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [currentIdx, phase, finishCalibration]);

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="size-16 text-emerald-400" />
          <p className="text-xl font-bold text-white">Calibration Complete!</p>
          <p className="text-sm text-white/60">Eye tracking accuracy improved</p>
        </div>
      </div>
    );
  }

  const currentPoint = CALIBRATION_POINTS[currentIdx]!;
  const targetX = typeof window !== "undefined" ? currentPoint.fx * window.innerWidth : 600;
  const targetY = typeof window !== "undefined" ? currentPoint.fy * window.innerHeight : 400;

  const ringRadius = 28;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDash = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-md">
      {/* Header info */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-lg font-semibold text-white">
          Look at the dot and hold your gaze steady
        </p>
        <p className="text-sm text-white/50">
          Point {currentIdx + 1} of {CALIBRATION_POINTS.length} — {currentPoint.label}
        </p>
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        aria-label="Cancel calibration"
      >
        <X className="size-5" />
      </button>

      {/* Calibration target dot */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
        style={{ left: `${targetX}px`, top: `${targetY}px` }}
      >
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full border-2 border-emerald-400/30 animate-ping"
            style={{ width: 80, height: 80, marginLeft: -40, marginTop: -40 }}
          />
        </div>

        {/* Progress ring */}
        <svg
          width="72"
          height="72"
          className="-rotate-90 transform"
          style={{ marginLeft: -36, marginTop: -36 }}
        >
          {/* Background ring */}
          <circle
            cx="36"
            cy="36"
            r={ringRadius}
            className="fill-none stroke-white/15"
            strokeWidth="3"
          />
          {/* Animated progress ring */}
          <circle
            cx="36"
            cy="36"
            r={ringRadius}
            className="fill-none stroke-emerald-400 transition-all duration-100"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner dot */}
        <div
          className="absolute rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
          style={{
            width: phase === "collect" ? 16 : 12,
            height: phase === "collect" ? 16 : 12,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            transition: "width 0.3s, height 0.3s",
          }}
        />

        {/* Crosshair lines */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="absolute w-px h-5 bg-white/20 -top-2.5 left-0" />
          <div className="absolute w-5 h-px bg-white/20 -left-2.5 top-0" />
        </div>

        {/* Phase label */}
        <p
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-white/70"
          style={{ top: 50 }}
        >
          {phase === "settle" ? "Hold steady…" : `Collecting… ${Math.round(progress * 100)}%`}
        </p>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs text-white/40">
          Keep your head still and move only your eyes to look at each target
        </p>
      </div>
    </div>
  );
}
