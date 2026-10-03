import { Eye, EyeOff, Sliders, ShieldCheck, Crosshair, ArrowUpDown } from "lucide-react";
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
import type { GazeSensitivity, EyeTrackingClickMode } from "@/lib/eye-tracking";

export function EyeTrackingSettingsSection() {
  const { eyeTrackingConfig, setEyeTrackingConfig, setEyeTrackingEnabled } = useAppState();

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold">
              👁️
            </span>
            <h3 className="font-semibold text-sm sm:text-base text-foreground">
              Eye-Tracking &amp; Gaze Control
            </h3>
            {eyeTrackingConfig.enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Navigate the platform and click using only your gaze. Engineered for users with ALS,
            quadriplegia, or severe motor disabilities. 100% on-device in WebAssembly.
          </p>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-center bg-secondary/80 px-3 py-1.5 rounded-full border border-border">
          <Label htmlFor="eye-tracking-master-toggle" className="text-xs font-semibold cursor-pointer">
            {eyeTrackingConfig.enabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="eye-tracking-master-toggle"
            checked={eyeTrackingConfig.enabled}
            onCheckedChange={setEyeTrackingEnabled}
            aria-label="Toggle eye tracking gaze navigation"
          />
        </div>
      </div>

      {/* Expanded Controls when Enabled */}
      {eyeTrackingConfig.enabled && (
        <div className="space-y-4 pt-3 border-t border-border/60">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Click Trigger Mode */}
            <div className="space-y-1.5">
              <Label htmlFor="eye-click-mode" className="text-xs font-medium text-foreground">
                Click Action Trigger
              </Label>
              <Select
                value={eyeTrackingConfig.clickMode}
                onValueChange={(val: EyeTrackingClickMode) =>
                  setEyeTrackingConfig((p) => ({ ...p, clickMode: val }))
                }
              >
                <SelectTrigger id="eye-click-mode" className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dwell">Dwell to Click (Look &amp; Hold)</SelectItem>
                  <SelectItem value="blink">Blink / Wink to Click</SelectItem>
                  <SelectItem value="both">Both (Dwell or Blink)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dwell Time Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="eye-dwell-time" className="text-xs font-medium text-foreground">
                Dwell Duration
              </Label>
              <Select
                value={String(eyeTrackingConfig.dwellTimeMs)}
                onValueChange={(val) =>
                  setEyeTrackingConfig((p) => ({ ...p, dwellTimeMs: Number(val) }))
                }
              >
                <SelectTrigger id="eye-dwell-time" className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="750">750ms (Fast)</SelectItem>
                  <SelectItem value="1000">1,000ms (Standard)</SelectItem>
                  <SelectItem value="1400">1,400ms (Relaxed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sensitivity */}
            <div className="space-y-1.5">
              <Label htmlFor="eye-sensitivity" className="text-xs font-medium text-foreground">
                Gaze Sensitivity
              </Label>
              <Select
                value={eyeTrackingConfig.sensitivity}
                onValueChange={(val: GazeSensitivity) =>
                  setEyeTrackingConfig((p) => ({ ...p, sensitivity: val }))
                }
              >
                <SelectTrigger id="eye-sensitivity" className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Stable, larger eye movement)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Minimal eye movement needed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Edge Scrolling Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-secondary/30">
              <div className="space-y-0.5">
                <Label htmlFor="eye-edge-scroll" className="text-xs font-medium cursor-pointer flex items-center gap-1">
                  <ArrowUpDown className="size-3 text-brand" />
                  Edge Auto-Scroll
                </Label>
                <p className="text-[10px] text-muted-foreground">Look at top/bottom of screen to scroll</p>
              </div>
              <Switch
                id="eye-edge-scroll"
                checked={eyeTrackingConfig.edgeScrollEnabled}
                onCheckedChange={(checked) =>
                  setEyeTrackingConfig((p) => ({ ...p, edgeScrollEnabled: checked }))
                }
              />
            </div>

            {/* Camera Preview Box Toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-border/60 bg-secondary/30">
              <div className="space-y-0.5">
                <Label htmlFor="eye-preview-box" className="text-xs font-medium cursor-pointer flex items-center gap-1">
                  <Eye className="size-3 text-brand" />
                  Live Iris & Camera Preview Box
                </Label>
                <p className="text-[10px] text-muted-foreground">Floating video feed with eye mesh tracking</p>
              </div>
              <Switch
                id="eye-preview-box"
                checked={eyeTrackingConfig.showCameraPreview}
                onCheckedChange={(checked) =>
                  setEyeTrackingConfig((p) => ({ ...p, showCameraPreview: checked }))
                }
              />
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Zero video frames or eye landmarks are saved or uploaded. All processing happens 100% locally.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
