import { Camera, CameraOff, RotateCcw, Sliders, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState } from "@/lib/app-state";
import {
  GESTURE_LABELS,
  ACTION_LABELS,
  DEFAULT_GESTURE_MAPPING,
  type HandGesture,
  type GestureAction,
  type GestureSensitivity,
} from "@/lib/gestures/types";

export function GestureSettingsSection() {
  const {
    gestureConfig,
    setGestureEnabled,
    setGestureSensitivity,
    updateGestureMapping,
    setGestureConfig,
  } = useAppState();

  const gesturesList = Object.keys(GESTURE_LABELS) as HandGesture[];
  const actionsList: (GestureAction | "none")[] = [
    "next_job",
    "previous_job",
    "select",
    "back",
    "save_job",
    "scroll_down",
    "scroll_up",
    "pause_gestures",
    "none",
  ];

  return (
    <div className="space-y-5 rounded-2xl border border-border/80 bg-card/60 p-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
              ✋
            </span>
            <h3 className="font-semibold text-base text-foreground">Hand-Gesture Navigation</h3>
            {gestureConfig.enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Camera On
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Control job browsing hands-free using your webcam. Runs 100% on your device via browser
            WebAssembly — video is never recorded or sent to any server.
          </p>
        </div>

        {/* Master Enable/Disable Switch */}
        <div className="flex items-center gap-3">
          <Label htmlFor="gesture-toggle" className="text-xs font-medium cursor-pointer">
            {gestureConfig.enabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="gesture-toggle"
            checked={gestureConfig.enabled}
            onCheckedChange={setGestureEnabled}
            aria-label="Toggle hand gesture navigation"
          />
        </div>
      </div>

      {/* When Gesture Navigation is Enabled */}
      {gestureConfig.enabled && (
        <div className="space-y-5 border-t border-border/60 pt-4">
          {/* Active Banner with 1-click OFF */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium text-foreground">
                Webcam is active for gesture tracking. Position your hand 1–2 feet in front of the
                lens.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGestureEnabled(false)}
              className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 font-semibold text-destructive hover:bg-destructive hover:text-white border border-destructive/30 transition-colors"
            >
              <CameraOff className="size-3" />
              Turn camera off
            </button>
          </div>

          {/* Sensitivity Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sensitivity-options"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Sliders className="size-3.5 text-brand" />
                Detection Sensitivity & Hold Time
              </label>
              <span className="text-xs text-muted-foreground">Default: Medium (~500ms hold)</span>
            </div>
            <div id="sensitivity-options" className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as GestureSensitivity[]).map((level) => {
                const active = gestureConfig.sensitivity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setGestureSensitivity(level)}
                    className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                      active
                        ? "border-brand bg-brand/10 font-semibold text-foreground shadow-sm"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                    aria-pressed={active}
                  >
                    <div className="capitalize font-medium text-foreground">{level}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {level === "low" && "700ms hold (most steady)"}
                      {level === "medium" && "500ms hold (balanced)"}
                      {level === "high" && "350ms hold (quick response)"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Preview Skeleton Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                {gestureConfig.showPreview ? (
                  <Eye className="size-3.5 text-brand" />
                ) : (
                  <EyeOff className="size-3.5 text-muted-foreground" />
                )}
                Show Hand Skeleton Preview Box
              </span>
              <p className="text-[11px] text-muted-foreground">
                Draws landmarks and bone joints on a live thumbnail in the bottom corner
              </p>
            </div>
            <Switch
              checked={gestureConfig.showPreview}
              onCheckedChange={(checked) =>
                setGestureConfig((c) => ({ ...c, showPreview: checked }))
              }
              aria-label="Toggle camera skeleton preview"
            />
          </div>

          {/* Air cursor toggle */}
          <div className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand/5 p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span aria-hidden="true">☝️</span>
                Control Cursor in Air
              </span>
              <p className="text-[11px] text-muted-foreground">
                Point with your index finger. Pinch thumb and index finger to click.
              </p>
            </div>
            <Switch
              checked={gestureConfig.airCursorEnabled}
              onCheckedChange={(checked) =>
                setGestureConfig((c) => ({ ...c, airCursorEnabled: checked }))
              }
              aria-label="Toggle air cursor control"
            />
          </div>

          {/* Gesture Mapping Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Custom Gesture Actions Mapping
              </span>
              <button
                type="button"
                onClick={() =>
                  setGestureConfig((c) => ({ ...c, mapping: { ...DEFAULT_GESTURE_MAPPING } }))
                }
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium"
              >
                <RotateCcw className="size-3" />
                Reset mappings
              </button>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border overflow-hidden bg-background">
              {gesturesList.map((g) => {
                const label = GESTURE_LABELS[g];
                const currentAction = gestureConfig.mapping[g];

                return (
                  <div
                    key={g}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg leading-none" aria-hidden="true">
                        {label.icon}
                      </span>
                      <div>
                        <div className="font-semibold text-foreground">{label.name}</div>
                        <div className="text-[11px] text-muted-foreground">{label.description}</div>
                      </div>
                    </div>

                    <div className="sm:w-56 shrink-0">
                      <Select
                        value={currentAction}
                        onValueChange={(val) =>
                          updateGestureMapping(g, val as GestureAction | "none")
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionsList.map((act) => (
                            <SelectItem key={act} value={act} className="text-xs">
                              {ACTION_LABELS[act].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Camera Permission & Troubleshooting Help */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <span>💡</span> Having trouble starting your webcam?
            </div>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px] leading-relaxed">
              <li>
                <strong>Browser Permission:</strong> Click the tune/lock icon in your browser
                address bar and verify <em>Camera</em> is set to <em>Allow</em>.
              </li>
              <li>
                <strong>macOS System Permissions:</strong> Open{" "}
                <em>System Settings &rarr; Privacy &amp; Security &rarr; Camera</em> and ensure your
                browser has permission.
              </li>
              <li>
                <strong>Camera in Use:</strong> Close other apps that might be holding the webcam
                (Zoom, FaceTime, Google Meet, Teams).
              </li>
              <li>
                <strong>Security:</strong> Camera access requires a secure origin (localhost or
                HTTPS).
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Multi-modal Guarantee Footer */}
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
        <ShieldCheck className="size-4 text-brand shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Accessibility Standard:</strong> Hand gestures are an optional assistive input.
          Every feature remains 100% accessible via standard keyboard navigation, screen reader
          shortcuts, voice input, and touch controls.
        </p>
      </div>
    </div>
  );
}
