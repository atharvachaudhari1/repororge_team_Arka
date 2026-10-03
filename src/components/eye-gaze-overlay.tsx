import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Crosshair,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  RotateCcw,
  Target,
} from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { useEyeTracking } from "@/lib/eye-tracking";
import { Button } from "@/components/ui/button";
import { EyeTrackingCalibration } from "./eye-tracking-calibration";

export function EyeGazeOverlay() {
  const { eyeTrackingConfig, setEyeTrackingConfig } = useAppState();
  const [collapsed, setCollapsed] = useState(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleGazeClick = useCallback((_el: HTMLElement, x: number, y: number) => {
    setClickRipple({ x, y, id: Date.now() });
    setTimeout(() => setClickRipple(null), 600);
  }, []);

  const {
    status,
    errorMessage,
    gazePoint,
    dwellProgress,
    dwellElementLabel,
    isPaused,
    isCalibrated,
    togglePause,
    restartEyeTracking,
    recalibrate,
    startCalibration,
    applyCalibration,
    cancelCalibration,
    isCalibrating,
    videoRef,
    canvasRef,
  } = useEyeTracking({
    config: eyeTrackingConfig,
    onGazeClick: handleGazeClick,
  });

  if (!eyeTrackingConfig.enabled) {
    return null;
  }

  // Circular progress calculations for SVG ring (radius 22, circumference ~138.2)
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - dwellProgress * circumference;

  const showPreviewBox =
    eyeTrackingConfig.showCameraPreview &&
    !collapsed &&
    (status === "tracking" || status === "paused" || status === "initializing" || status === "loading_model");

  return (
    <>
      {/* 1. Live Gaze Pointer Reticle */}
      {eyeTrackingConfig.showPointer && gazePoint && status === "tracking" && !isPaused && (
        <div
          className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
          style={{
            left: `${gazePoint.clientX}px`,
            top: `${gazePoint.clientY}px`,
          }}
          aria-hidden="true"
        >
          {/* Outer SVG Dwell Progress Ring */}
          <div className="relative flex items-center justify-center size-14">
            <svg className="size-14 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-black/20 dark:stroke-white/20 fill-none"
                strokeWidth="3.5"
              />
              {/* Animated progress ring */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="stroke-brand fill-brand/10 transition-all duration-75"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Center Bullseye Dot */}
            <div className="absolute size-3 rounded-full bg-brand shadow-[0_0_8px_rgba(20,24,23,0.6)] ring-2 ring-white dark:ring-stone-900" />
          </div>

          {/* Dwell Target Tooltip Label */}
          {dwellElementLabel && dwellProgress > 0.15 && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-950/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-xs">
              {dwellElementLabel}
            </div>
          )}
        </div>
      )}

      {/* 2. Visual Click Ripple Indicator */}
      {clickRipple && (
        <div
          key={clickRipple.id}
          className="pointer-events-none fixed z-[9998] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-brand/30 animate-ping"
          style={{
            left: `${clickRipple.x}px`,
            top: `${clickRipple.y}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* 3. Floating Eye Tracking Status & Quick Controls */}
      <aside
        aria-label="Eye Tracking Assistive Status"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md max-w-xs transition-all dark:border-stone-700"
      >
        {/* Header bar: Status + 1-Click Turn Off */}
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              {status === "tracking" && !isPaused && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  status === "tracking" && !isPaused
                    ? "bg-emerald-500"
                    : status === "paused"
                      ? "bg-amber-500"
                      : status === "error"
                        ? "bg-destructive"
                        : "bg-brand animate-pulse"
                }`}
              />
            </span>
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {status === "tracking" && !isPaused ? (
                <>
                  <Camera className="size-3.5 text-brand" />
                  Eye Tracking Active
                </>
              ) : status === "paused" ? (
                <>
                  <VideoOff className="size-3.5 text-amber-500" />
                  Gaze Paused
                </>
              ) : status === "loading_model" ? (
                <>
                  <Camera className="size-3.5 text-brand animate-pulse" />
                  Loading Model...
                </>
              ) : status === "requesting_permission" || status === "initializing" ? (
                <>
                  <Camera className="size-3.5 text-brand animate-pulse" />
                  Connecting Camera...
                </>
              ) : (
                <>
                  <CameraOff className="size-3.5 text-destructive" />
                  Camera Blocked
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={collapsed ? "Expand eye tracking preview" : "Collapse eye tracking preview"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setEyeTrackingConfig((p) => ({ ...p, enabled: false }))}
              className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors flex items-center gap-1 border border-destructive/30"
              title="Turn off eye tracking immediately"
            >
              <EyeOff className="size-3" />
              Turn Off
            </button>
          </div>
        </div>

        {/* Camera Video Stream & Eye/Iris Preview Box - Kept mounted in DOM to prevent stream teardown */}
        <div
          className={
            showPreviewBox
              ? "relative mx-auto h-[120px] w-44 overflow-hidden rounded-lg border border-border/80 bg-stone-950 shadow-inner mt-1"
              : "fixed -top-[9999px] -left-[9999px] size-1 opacity-0 pointer-events-none overflow-hidden"
          }
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={
              showPreviewBox
                ? "absolute inset-0 h-full w-full object-cover -scale-x-100"
                : "size-1 pointer-events-none"
            }
            aria-hidden="true"
            tabIndex={-1}
          />
          {showPreviewBox && (
            <>
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                aria-label="Iris and eye tracking live preview"
              />
              <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white/80 pointer-events-none flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Iris Tracking</span>
              </div>
            </>
          )}
        </div>

        {/* Collapsible Body */}
        {!collapsed && (
          <div className="space-y-2 pt-1">
            {/* Error Message with Retry Camera option */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive flex flex-col gap-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="leading-tight">{errorMessage}</p>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-destructive/20">
                  <button
                    type="button"
                    onClick={restartEyeTracking}
                    className="rounded bg-destructive/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-destructive hover:text-white transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="size-3" />
                    Retry Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setEyeTrackingConfig((p) => ({ ...p, enabled: false }))}
                    className="rounded border border-destructive/30 px-2.5 py-1 text-[11px] hover:bg-destructive/10 transition-colors"
                  >
                    Turn Off
                  </button>
                </div>
              </div>
            )}

            {/* Model / Camera Loading Progress Indicator */}
            {(status === "loading_model" || status === "requesting_permission" || status === "initializing") && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <span className="size-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                <span>
                  {status === "loading_model"
                    ? "Loading vision model..."
                    : "Connecting to camera..."}
                </span>
              </div>
            )}

            {!errorMessage && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Click Trigger:</span>
                  <span className="font-semibold text-foreground capitalize">
                    {eyeTrackingConfig.clickMode} ({eyeTrackingConfig.dwellTimeMs}ms)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Edge Scroll:</span>
                  <span className="font-semibold text-foreground">
                    {eyeTrackingConfig.edgeScrollEnabled ? "Active (Look Up/Down)" : "Off"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs gap-1 border-border font-medium"
                    onClick={recalibrate}
                    title="Center cursor to where you are currently looking"
                  >
                    <Crosshair className="size-3" />
                    Center Gaze
                  </Button>
                  <Button
                    type="button"
                    variant={isCalibrated ? "outline" : "default"}
                    size="sm"
                    className={`h-7 text-xs gap-1 font-medium ${
                      isCalibrated
                        ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                        : ""
                    }`}
                    onClick={startCalibration}
                    title="Run 5-point calibration for improved accuracy"
                    disabled={status !== "tracking"}
                  >
                    <Target className="size-3" />
                    {isCalibrated ? "Re-calibrate" : "Calibrate"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 border-border font-medium"
                    onClick={() =>
                      setEyeTrackingConfig((p) => ({
                        ...p,
                        showCameraPreview: !p.showCameraPreview,
                      }))
                    }
                    title={
                      eyeTrackingConfig.showCameraPreview
                        ? "Hide camera preview"
                        : "Show camera preview"
                    }
                  >
                    {eyeTrackingConfig.showCameraPreview ? (
                      <VideoOff className="size-3" />
                    ) : (
                      <Video className="size-3" />
                    )}
                  </Button>
                </div>

                {/* Calibration status badge */}
                {isCalibrated && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Calibrated — tracking accuracy improved
                  </div>
                )}

                {/* Quick Pause / Resume & Privacy Note */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {isPaused ? "Resume tracking" : "Pause tracking"}
                  </button>
                  <span className="text-[10px] text-muted-foreground">100% On-device</span>
                </div>
              </>
            )}
          </div>
        )}
      </aside>

      {/* 4. Calibration Overlay */}
      {isCalibrating && status === "tracking" && (
        <EyeTrackingCalibration
          gazePoint={gazePoint}
          onComplete={applyCalibration}
          onCancel={cancelCalibration}
        />
      )}
    </>
  );
}
