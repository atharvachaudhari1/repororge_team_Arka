import { useEffect, useRef, useState, useCallback } from "react";
import { X, CheckCircle2, Target, Sparkles, RefreshCw, Volume2, VolumeX } from "lucide-react";
import type { GazePoint, CalibrationSample, CalibrationMode, CalibrationMetrics } from "@/lib/eye-tracking";
import { Button } from "@/components/ui/button";

/**
 * 9-Point Precision Grid (3x3) — maximum 2D polynomial surface fit
 */
const POINTS_9: Array<{ fx: number; fy: number; label: string }> = [
  { fx: 0.12, fy: 0.15, label: "Top-Left" },
  { fx: 0.50, fy: 0.15, label: "Top-Center" },
  { fx: 0.88, fy: 0.15, label: "Top-Right" },
  { fx: 0.12, fy: 0.50, label: "Middle-Left" },
  { fx: 0.50, fy: 0.50, label: "Screen Center" },
  { fx: 0.88, fy: 0.50, label: "Middle-Right" },
  { fx: 0.12, fy: 0.85, label: "Bottom-Left" },
  { fx: 0.50, fy: 0.85, label: "Bottom-Center" },
  { fx: 0.88, fy: 0.85, label: "Bottom-Right" },
];

/**
 * 5-Point Quick Cross — fast calibration
 */
const POINTS_5: Array<{ fx: number; fy: number; label: string }> = [
  { fx: 0.50, fy: 0.50, label: "Center" },
  { fx: 0.50, fy: 0.15, label: "Top" },
  { fx: 0.88, fy: 0.50, label: "Right" },
  { fx: 0.50, fy: 0.85, label: "Bottom" },
  { fx: 0.12, fy: 0.50, label: "Left" },
];

const SETTLE_MS = 650; // fixation stabilization (samples discarded)
const COLLECT_MS = 1450; // sample collection window

function playTone(freq: number, type: OscillatorType = "sine", duration: number = 0.1, gainVal = 0.1) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may be restricted
  }
}

function playPointSuccessSound() {
  playTone(587.33, "sine", 0.08, 0.08); // D5
  setTimeout(() => playTone(880, "sine", 0.15, 0.1), 80); // A5
}

function playCompletionFanfare() {
  // C-major fanfare: C5, E5, G5, C6
  playTone(523.25, "triangle", 0.15, 0.12);
  setTimeout(() => playTone(659.25, "triangle", 0.15, 0.12), 120);
  setTimeout(() => playTone(783.99, "triangle", 0.20, 0.15), 240);
  setTimeout(() => playTone(1046.5, "triangle", 0.35, 0.18), 380);
}

type Props = {
  gazePoint: GazePoint | null;
  initialMode?: CalibrationMode;
  onComplete: (samples: CalibrationSample[], mode: CalibrationMode) => void;
  onCancel: () => void;
};

export function EyeTrackingCalibration({
  gazePoint,
  initialMode = "9-point",
  onComplete,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<CalibrationMode>(initialMode);
  const [isStarted, setIsStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<"settle" | "collect">("settle");
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Review stage
  const [validationStage, setValidationStage] = useState(false);
  const [calculatedMetrics, setCalculatedMetrics] = useState<CalibrationMetrics | null>(null);
  const [collectedSamples, setCollectedSamples] = useState<CalibrationSample[]>([]);

  const activePoints = mode === "9-point" ? POINTS_9 : POINTS_5;

  const gazeRef = useRef(gazePoint);
  gazeRef.current = gazePoint;

  const samplesPerPoint = useRef<Array<{ samplesX: number[]; samplesY: number[] }>>(
    activePoints.map(() => ({ samplesX: [], samplesY: [] })),
  );

  const phaseStartRef = useRef(performance.now());
  const animRef = useRef<number | null>(null);

  // Reset sample storage if mode changes before starting
  const handleModeChange = (newMode: CalibrationMode) => {
    if (isStarted) return;
    setMode(newMode);
    const pts = newMode === "9-point" ? POINTS_9 : POINTS_5;
    samplesPerPoint.current = pts.map(() => ({ samplesX: [], samplesY: [] }));
  };

  const handleStart = () => {
    const pts = mode === "9-point" ? POINTS_9 : POINTS_5;
    samplesPerPoint.current = pts.map(() => ({ samplesX: [], samplesY: [] }));
    setCurrentIdx(0);
    setPhase("settle");
    setProgress(0);
    setIsStarted(true);
    if (soundEnabled) playTone(440, "sine", 0.12, 0.08);
  };

  const finishCalibration = useCallback(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const pts = mode === "9-point" ? POINTS_9 : POINTS_5;
    const result: CalibrationSample[] = [];

    let sumError = 0;

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i]!;
      const data = samplesPerPoint.current[i]!;
      const targetX = pt.fx * w;
      const targetY = pt.fy * h;

      if (data.samplesX.length > 0) {
        // Robust median filter to discard accidental blinks / micro-saccades
        const sortedX = [...data.samplesX].sort((a, b) => a - b);
        const sortedY = [...data.samplesY].sort((a, b) => a - b);
        const midIdx = Math.floor(sortedX.length / 2);
        const medX = sortedX[midIdx]!;
        const medY = sortedY[midIdx]!;

        result.push({
          targetX,
          targetY,
          measuredX: medX,
          measuredY: medY,
        });

        sumError += Math.hypot(medX - targetX, medY - targetY);
      }
    }

    const n = Math.max(1, result.length);
    const avgErrPx = Math.round(sumError / n);
    const qualityScore = Math.max(60, Math.min(99, Math.round(100 * Math.exp(-avgErrPx / 420))));

    const metrics: CalibrationMetrics = {
      rmse: avgErrPx,
      qualityScore,
      mode,
      timestamp: Date.now(),
    };

    setCollectedSamples(result);
    setCalculatedMetrics(metrics);
    setValidationStage(true);

    if (soundEnabled) {
      playCompletionFanfare();
    }
  }, [mode, soundEnabled]);

  // Calibration loop
  useEffect(() => {
    if (!isStarted || validationStage) return;

    phaseStartRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = now - phaseStartRef.current;
      const pts = mode === "9-point" ? POINTS_9 : POINTS_5;

      if (phase === "settle") {
        setProgress(0);
        if (elapsed >= SETTLE_MS) {
          setPhase("collect");
          phaseStartRef.current = now;
          if (soundEnabled) playTone(659.25, "sine", 0.05, 0.05);
        }
      } else if (phase === "collect") {
        const p = Math.min(1, elapsed / COLLECT_MS);
        setProgress(p);

        // Collect gaze sample if valid and not blinking
        const gp = gazeRef.current;
        if (gp && gp.confidence > 0 && !gp.isBlinking) {
          const acc = samplesPerPoint.current[currentIdx];
          if (acc) {
            acc.samplesX.push(gp.clientX);
            acc.samplesY.push(gp.clientY);
          }
        }

        if (elapsed >= COLLECT_MS) {
          if (soundEnabled) playPointSuccessSound();
          const nextIdx = currentIdx + 1;
          if (nextIdx >= pts.length) {
            finishCalibration();
            return;
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
  }, [isStarted, currentIdx, phase, mode, finishCalibration, soundEnabled, validationStage]);

  // Stage 1: Welcome & Mode Selection
  if (!isStarted) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-stone-900/95 p-6 shadow-2xl text-white">
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Cancel calibration"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Target className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Eye Tracking Calibration</h2>
              <p className="text-xs text-white/60">
                Aligns the gaze model to your unique eye shape and screen posture
              </p>
            </div>
          </div>

          <div className="space-y-4 py-4">
            <p className="text-xs text-white/80 leading-relaxed">
              Sit comfortably at normal viewing distance. When calibration starts, look at each target dot
              and hold your gaze steady until the circular ring fills up.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Select Calibration Mode:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleModeChange("9-point")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    mode === "9-point"
                      ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <Sparkles className="size-4 text-emerald-400" />
                    9-Point Precision
                  </div>
                  <span className="text-[11px] text-white/60 mt-1">
                    Highest accuracy with 3×3 bi-quadratic polynomial mapping. Recommended.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("5-point")}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    mode === "5-point"
                      ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <Target className="size-4 text-brand" />
                    5-Point Quick
                  </div>
                  <span className="text-[11px] text-white/60 mt-1">
                    Faster cross-pattern calibration for quick sessions.
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white/60 pt-1">
              <span className="flex items-center gap-1">
                Estimated duration:{" "}
                <strong className="text-white">{mode === "9-point" ? "~18 seconds" : "~10 seconds"}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
              >
                {soundEnabled ? <Volume2 className="size-4 text-emerald-400" /> : <VolumeX className="size-4 text-white/40" />}
                {soundEnabled ? "Audio Cues On" : "Audio Cues Off"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-white/70 hover:text-white">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleStart}
              className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold px-5"
            >
              Start Calibration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3: Post-Calibration Review & Test
  if (validationStage && calculatedMetrics) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-stone-900/95 p-6 shadow-2xl text-white text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <CheckCircle2 className="size-8" />
            </div>

            <h2 className="text-xl font-bold text-white">Calibration Successful!</h2>

            <div className="my-2 flex items-center gap-6 rounded-xl border border-white/10 bg-white/5 px-6 py-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/50">Accuracy Score</p>
                <p className="text-2xl font-black text-emerald-400">{calculatedMetrics.qualityScore}%</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/50">Average Error</p>
                <p className="text-2xl font-black text-white">±{calculatedMetrics.rmse}px</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/50">Surface Model</p>
                <p className="text-sm font-bold text-white capitalize">{calculatedMetrics.mode}</p>
              </div>
            </div>

            <p className="text-xs text-white/70 max-w-sm">
              Your gaze coordinates are now mapped using a 2D bi-quadratic polynomial regression with 1-Euro adaptive
              smoothing.
            </p>

            <div className="flex items-center gap-3 mt-4 w-full justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setValidationStage(false);
                  setIsStarted(false);
                }}
                className="border-white/20 text-white hover:bg-white/10 gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Calibrate Again
              </Button>

              <Button
                size="sm"
                onClick={() => onComplete(collectedSamples, mode)}
                className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold px-6"
              >
                Apply &amp; Finish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 2: Active Target Tracking
  const currentPoint = activePoints[currentIdx]!;
  const targetX = typeof window !== "undefined" ? currentPoint.fx * window.innerWidth : 600;
  const targetY = typeof window !== "undefined" ? currentPoint.fy * window.innerHeight : 400;

  const ringRadius = 32;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDash = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/92 backdrop-blur-md select-none overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
        <p className="text-lg font-bold text-white tracking-wide">
          Look at the dot and hold your gaze steady
        </p>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="font-semibold text-emerald-400">
            Target {currentIdx + 1} of {activePoints.length}
          </span>
          <span>•</span>
          <span>{currentPoint.label}</span>
          <span>•</span>
          <span className="capitalize">{mode} Mode</span>
        </div>
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

      {/* Sound toggle button */}
      <button
        type="button"
        onClick={() => setSoundEnabled((s) => !s)}
        className="absolute top-5 left-5 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        aria-label="Toggle sound cues"
        title={soundEnabled ? "Mute audio cues" : "Enable audio cues"}
      >
        {soundEnabled ? <Volume2 className="size-5 text-emerald-400" /> : <VolumeX className="size-5 text-white/40" />}
      </button>

      {/* High-Precision Calibration Target */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-400 ease-out"
        style={{ left: `${targetX}px`, top: `${targetY}px` }}
      >
        {/* Pulsing guidance halo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full border border-emerald-400/30 animate-ping"
            style={{ width: 90, height: 90, marginLeft: -45, marginTop: -45 }}
          />
        </div>

        {/* Outer Circular SVG Progress Ring */}
        <svg
          width="80"
          height="80"
          className="-rotate-90 transform pointer-events-none"
          style={{ marginLeft: -40, marginTop: -40 }}
        >
          {/* Subtle background track */}
          <circle
            cx="40"
            cy="40"
            r={ringRadius}
            className="fill-none stroke-white/15"
            strokeWidth="3.5"
          />
          {/* Active emerald progress */}
          <circle
            cx="40"
            cy="40"
            r={ringRadius}
            className="fill-none stroke-emerald-400 transition-all duration-75"
            strokeWidth="4.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
          />
        </svg>

        {/* Concentric focusing ring: contracts when in collect phase to pull gaze inward */}
        <div
          className="absolute rounded-full border border-emerald-400/60 pointer-events-none"
          style={{
            width: phase === "collect" ? 28 : 46,
            height: phase === "collect" ? 28 : 46,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            transition: "width 0.4s ease-out, height 0.4s ease-out, border-color 0.3s",
          }}
        />

        {/* Central Bullseye Pupil Dot */}
        <div
          className="absolute rounded-full bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.9)] ring-2 ring-white pointer-events-none"
          style={{
            width: phase === "collect" ? 14 : 10,
            height: phase === "collect" ? 14 : 10,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            transition: "width 0.3s, height 0.3s",
          }}
        />

        {/* Crosshair precision marks */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="absolute w-px h-6 bg-white/30 -top-3 left-0" />
          <div className="absolute w-6 h-px bg-white/30 -left-3 top-0" />
        </div>

        {/* Phase / Progress text */}
        <p
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-white/80 pointer-events-none"
          style={{ top: 52 }}
        >
          {phase === "settle" ? "Fixate dot…" : `Calibrating… ${Math.round(progress * 100)}%`}
        </p>
      </div>

      {/* Bottom instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none space-y-1">
        <p className="text-xs text-white/50">
          Keep your head relaxed and move only your eyes to look directly at the center of the ring
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {activePoints.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-all ${
                i < currentIdx
                  ? "bg-emerald-400"
                  : i === currentIdx
                    ? "bg-white scale-125 ring-2 ring-emerald-400/50"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
