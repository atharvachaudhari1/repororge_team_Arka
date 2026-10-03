import { useState } from "react";
import {
  Camera,
  CameraOff,
  Video,
  VideoOff,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { useHandGestures } from "@/lib/gestures/use-hand-gestures";
import { GESTURE_LABELS, ACTION_LABELS, type HandGesture } from "@/lib/gestures/types";

/**
 * Floating on-screen camera indicator and gesture overlay.
 * Appears whenever Hand Gesture Navigation is enabled.
 * Features:
 * - Clear, persistent "Camera is ON" indicator with one-click OFF button.
 * - Live hold-progress ring for static gestures (~500ms).
 * - Optional collapsible camera/skeleton preview.
 * - ARIA live region for screen-reader feedback.
 */
export function HandGestureIndicator() {
  const { gestureConfig, setGestureEnabled } = useAppState();
  const [collapsed, setCollapsed] = useState(false);

  const {
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
    restartGestures,
  } = useHandGestures({
    config: gestureConfig,
  });

  if (!gestureConfig.enabled) {
    return null;
  }

  const activeLabel = activeGesture ? GESTURE_LABELS[activeGesture] : null;
  const lastActionLabel = lastTriggeredAction ? ACTION_LABELS[lastTriggeredAction]?.label : null;
  const showPreviewBox =
    gestureConfig.showPreview &&
    !collapsed &&
    (status === "detecting" || status === "low_performance" || status === "paused");

  return (
    <aside
      aria-label="Hand Gesture Navigation Status"
      className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 rounded-2xl border border-[#191716]/20 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md max-w-xs transition-all dark:border-stone-700"
    >
      {/* Screen Reader ARIA Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header bar: Status + 1-Click Camera Off */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            {status === "detecting" && !isPaused && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex size-2.5 rounded-full ${
                status === "detecting" && !isPaused
                  ? "bg-emerald-500"
                  : status === "paused"
                    ? "bg-amber-500"
                    : status === "permission_denied" || status === "unavailable"
                      ? "bg-destructive"
                      : "bg-stone-400"
              }`}
            />
          </span>
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {status === "detecting" && !isPaused ? (
              <>
                <Camera className="size-3.5 text-brand" />
                Camera Active
              </>
            ) : status === "paused" ? (
              <>
                <VideoOff className="size-3.5 text-amber-500" />
                Gestures Paused
              </>
            ) : status === "loading_model" || status === "requesting_permission" ? (
              <>
                <Camera className="size-3.5 text-brand animate-pulse" />
                Connecting Camera...
              </>
            ) : (
              <>
                <CameraOff className="size-3.5 text-destructive" />
                Camera Blocked / Offline
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={collapsed ? "Expand gesture preview" : "Collapse gesture preview"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setGestureEnabled(false)}
            className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors flex items-center gap-1 border border-destructive/30"
            title="Turn camera off immediately"
          >
            <CameraOff className="size-3" />
            Turn Off
          </button>
        </div>
      </div>

      {/* Camera Video Stream & Skeleton Canvas Container - Kept permanently mounted to prevent stream restarts */}
      <div
        className={
          showPreviewBox
            ? "relative mx-auto h-[120px] w-40 overflow-hidden rounded-lg border border-border/80 bg-stone-950 shadow-inner mt-1"
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
              aria-label="Hand skeleton live preview"
            />
            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] font-mono text-white/80 pointer-events-none">
              100% on-device
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="space-y-2.5 pt-1">
          {/* Permission / Status Errors with Retry option */}
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
                  onClick={restartGestures}
                  className="rounded bg-destructive/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-destructive hover:text-white transition-colors"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => setGestureEnabled(false)}
                  className="rounded border border-destructive/30 px-2.5 py-1 text-[11px] hover:bg-destructive/10 transition-colors"
                >
                  Turn Off
                </button>
              </div>
            </div>
          )}

          {/* Model Loading indicator */}
          {status === "loading_model" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <span className="size-3 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <span>Loading on-device model...</span>
            </div>
          )}

          {/* Low performance note */}
          {status === "low_performance" && (
            <div className="rounded bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-900 dark:text-amber-200">
              Low device framerate. Gestures will continue with reduced resolution.
            </div>
          )}

          {/* Active Gesture Detection & Hold Progress Ring */}
          <div className="rounded-xl border border-border/60 bg-muted/40 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Current gesture:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                {activeLabel ? (
                  <>
                    <span>{activeLabel.icon}</span>
                    <span>{activeLabel.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground font-normal italic">
                    Waiting for hand...
                  </span>
                )}
              </span>
            </div>

            {/* Hold progress bar (for 500ms confirmation) */}
            {activeGesture && !activeGesture.startsWith("swipe_") && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Hold to confirm:</span>
                  <span>{Math.round(holdProgress * 100)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                  <div
                    className="h-full bg-brand transition-all duration-75"
                    style={{ width: `${Math.round(holdProgress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Last Triggered Action announcement */}
            {lastTriggeredGesture && lastActionLabel && (
              <div className="mt-2 border-t border-border/40 pt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
                <span>Triggered:</span>
                <span>{lastActionLabel}</span>
              </div>
            )}
          </div>

          {/* Quick controls: Pause detection toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={togglePause}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {isPaused ? "Resume detection" : "Pause detection"}
            </button>
            <span className="text-[10px] text-muted-foreground">Local WASM only</span>
          </div>
        </div>
      )}
    </aside>
  );
}
