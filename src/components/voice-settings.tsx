import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAppState } from "@/lib/app-state";

export function VoiceSettingsSection() {
  const { voiceNavConfig, setVoiceNavConfig, setVoiceNavEnabled } = useAppState();

  return (
    <div className="space-y-5 rounded-2xl border border-border/80 bg-card/60 p-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#7BD3C2] text-[#141817] text-xs font-bold font-serif">
              🎙️
            </span>
            <h3 className="font-semibold text-base text-foreground font-serif">
              Janvi Voice Navigation
            </h3>
            {voiceNavConfig.enabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Listening
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Hands-free autonomous website control designed for individuals with motor disabilities,
            limb differences, or paralysis. Control pages, click buttons by number, and search using
            voice commands.
          </p>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <Label htmlFor="jarvis-voice-toggle" className="text-xs font-semibold cursor-pointer">
            {voiceNavConfig.enabled ? "Enabled" : "Disabled"}
          </Label>
          <Switch
            id="jarvis-voice-toggle"
            checked={voiceNavConfig.enabled}
            onCheckedChange={setVoiceNavEnabled}
            aria-label="Toggle JARVIS Voice Navigation"
          />
        </div>
      </div>

      {voiceNavConfig.enabled ? (
        <div className="space-y-4 border-t border-border/60 pt-4">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Click-by-Number Overlay Badges */}
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <Layers className="size-3.5 text-brand" />
                  Numbered Target Badges
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Overlays high-contrast numbers on every button and link so you can say "Click 3"
                  or "Open 5".
                </p>
              </div>
              <Switch
                checked={voiceNavConfig.showNumberedBadges}
                onCheckedChange={(checked) =>
                  setVoiceNavConfig((prev) => ({ ...prev, showNumberedBadges: checked }))
                }
                aria-label="Toggle Numbered Target Badges"
              />
            </div>

            {/* 2. Wake-word requirement */}
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <Sparkles className="size-3.5 text-amber-500" />
                  "Hey Janvi" Wake Word Required
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Commands only run after you say "Hey Janvi", so normal conversation cannot
                  control the website.
                </p>
              </div>
              <Switch
                checked={voiceNavConfig.wakeWordRequired}
                disabled
                  aria-label="Hey Janvi wake word is required"
              />
            </div>

            {/* 3. Spoken Voice Feedback (SpeechSynthesis) */}
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  {voiceNavConfig.speechFeedback ? (
                    <Volume2 className="size-3.5 text-brand" />
                  ) : (
                    <VolumeX className="size-3.5 text-muted-foreground" />
                  )}
                  Janvi Verbal Responses
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Janvi speaks verbal confirmations aloud (e.g. "Opening Jobs", "Scrolling down").
                </p>
              </div>
              <Switch
                checked={voiceNavConfig.speechFeedback}
                onCheckedChange={(checked) =>
                  setVoiceNavConfig((prev) => ({ ...prev, speechFeedback: checked }))
                }
                aria-label="Toggle Janvi verbal voice responses"
              />
            </div>

            {/* 4. Audio Chimes & Sound Effects */}
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/50 p-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                  <Sparkles className="size-3.5 text-brand" />
                  Harmonic Chimes & Tones
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Futuristic audio chimes when Janvi wakes, executes an action, or enters standby.
                </p>
              </div>
              <Switch
                checked={voiceNavConfig.soundEffects}
                onCheckedChange={(checked) =>
                  setVoiceNavConfig((prev) => ({ ...prev, soundEffects: checked }))
                }
                aria-label="Toggle Harmonic Chimes"
              />
            </div>
          </div>

          {/* Speech Rate & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-background/30 p-3.5">
            <div>
              <Label className="text-xs font-semibold text-foreground mb-1.5 block">
                Speech Recognition Accent &amp; Language
              </Label>
              <Select
                value={voiceNavConfig.lang}
                onValueChange={(val) => setVoiceNavConfig((prev) => ({ ...prev, lang: val }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">English (India - en-IN)</SelectItem>
                  <SelectItem value="en-US">English (United States - en-US)</SelectItem>
                  <SelectItem value="en-GB">English (United Kingdom - en-GB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-foreground">Janvi Speech Rate</Label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {voiceNavConfig.ttsRate.toFixed(2)}x
                </span>
              </div>
              <Slider
                min={0.8}
                max={1.4}
                step={0.05}
                value={[voiceNavConfig.ttsRate]}
                onValueChange={([val]) => {
                  if (val !== undefined) {
                    setVoiceNavConfig((prev) => ({ ...prev, ttsRate: val }));
                  }
                }}
                className="py-1"
                aria-label="Janvi speech rate"
              />
            </div>
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-2.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Private &amp; Hands-Free:</strong> Speech is processed directly through
              standard browser APIs. Audio streams are never stored or uploaded to third-party
              tracking servers.
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/80 bg-background/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Activate Janvi Voice Navigation to control Ableo completely hands-free using your
            voice.
          </p>
        </div>
      )}
    </div>
  );
}
