import { useState } from "react";
import {
  Contrast,
  Eye,
  Hand,
  Ear,
  Brain,
  Mic,
  RotateCcw,
  Subtitles,
  Type,
  Volume2,
  BookOpen,
  Moon,
  Sun,
  Accessibility,
  ScanLine,
  AlignJustify,
  Focus,
} from "lucide-react";
import {
  useAppState,
  type FontSize,
  type LineSpacing,
  type MotionPref,
  type AccessibilityPreset,
} from "@/lib/app-state";
import { useTextToSpeech } from "@/lib/speech";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GestureSettingsSection } from "@/components/gesture-settings";

const SIZES: { value: FontSize; label: string }[] = [
  { value: "medium", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "Extra large" },
];

const LINE_SPACINGS: { value: LineSpacing; label: string }[] = [
  { value: "normal", label: "1x Line" },
  { value: "relaxed", label: "1.8x Line" },
  { value: "loose", label: "2.2x Line" },
];

/**
 * Reusable accessibility controls panel with clean editorial styling.
 */
export function AccessibilityControlsContent({ inDrawer = false }: { inDrawer?: boolean }) {
  const {
    theme,
    toggleTheme,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    lineSpacing,
    setLineSpacing,
    reducedDistraction,
    setReducedDistraction,
    motion,
    setMotion,
    dyslexiaFont,
    setDyslexiaFont,
    liveCaptions,
    setLiveCaptions,
    setCaptionText,
    activePreset,
    applyPreset,
    setVoiceAssistantOpen,
    readingRuler,
    setReadingRuler,
    ttsRate,
    setTtsRate,
  } = useAppState();

  const tts = useTextToSpeech();

  const readPage = () => {
    const main = document.getElementById("main");
    const text = (main?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    if (text) {
      setCaptionText(text.slice(0, 250));
      tts.play(text, ttsRate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active notification badge if preset is active */}
      {activePreset !== "custom" && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#191716]/20 bg-[#7BD3C2]/20 p-3 text-xs text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#191716] animate-pulse" />
            <span className="font-medium">
              {activePreset === "blind" &&
                "Vision mode active: high contrast, extra-large text, reduced motion."}
              {activePreset === "motor" &&
                "Motor mode active: enlarged touch targets, voice control enabled."}
              {activePreset === "deaf" &&
                "Hearing mode active: live subtitles enabled across audio/video."}
              {activePreset === "cognitive" &&
                "Focus mode active: dyslexia-friendly font, reduced animation."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => applyPreset("custom")}
            className="rounded-full bg-background/80 px-2.5 py-0.5 font-semibold text-xs text-destructive hover:bg-background border border-border"
          >
            Turn off
          </button>
        </div>
      )}

      {/* 1. Disability Profiles */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-serif italic text-stone-500 tracking-wide uppercase font-semibold">
            Disability Profiles
          </span>
          {activePreset !== "custom" && (
            <button
              type="button"
              onClick={() => applyPreset("custom")}
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-foreground font-medium"
            >
              <RotateCcw className="size-3" />
              Reset all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset(activePreset === "blind" ? "custom" : "blind")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              activePreset === "blind"
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
            aria-pressed={activePreset === "blind"}
          >
            <Eye className="size-3.5" />
            Vision
          </button>

          <button
            type="button"
            onClick={() => applyPreset(activePreset === "motor" ? "custom" : "motor")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              activePreset === "motor"
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
            aria-pressed={activePreset === "motor"}
          >
            <Hand className="size-3.5" />
            Motor
          </button>

          <button
            type="button"
            onClick={() => applyPreset(activePreset === "deaf" ? "custom" : "deaf")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              activePreset === "deaf"
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
            aria-pressed={activePreset === "deaf"}
          >
            <Ear className="size-3.5" />
            Hearing
          </button>

          <button
            type="button"
            onClick={() => applyPreset(activePreset === "cognitive" ? "custom" : "cognitive")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              activePreset === "cognitive"
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
            aria-pressed={activePreset === "cognitive"}
          >
            <Brain className="size-3.5" />
            Focus
          </button>
        </div>
      </div>

      {/* 2. Typography & Contrast */}
      <div className="space-y-2.5">
        <span className="text-xs font-serif italic text-stone-500 tracking-wide uppercase font-semibold">
          Typography & Display
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Size */}
          <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 p-0.5 bg-card">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFontSize(s.value)}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  fontSize === s.value
                    ? "bg-[#7BD3C2] text-[#141817] font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Line Spacing */}
          <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 p-0.5 bg-card items-center">
            <span className="px-2 text-stone-500 font-sans text-[11px] flex items-center gap-1">
              <AlignJustify className="size-3" />
              Spacing:
            </span>
            {LINE_SPACINGS.map((ls) => (
              <button
                key={ls.value}
                type="button"
                onClick={() => setLineSpacing(ls.value)}
                className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                  lineSpacing === ls.value
                    ? "bg-[#7BD3C2] text-[#141817] font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:text-foreground"
                }`}
              >
                {ls.label}
              </button>
            ))}
          </div>

          {/* Dyslexia font */}
          <button
            type="button"
            onClick={() => setDyslexiaFont(!dyslexiaFont)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              dyslexiaFont
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
          >
            <BookOpen className="size-3.5" />
            Dyslexia Font
          </button>

          {/* Reduced Distraction */}
          <button
            type="button"
            onClick={() => setReducedDistraction(!reducedDistraction)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              reducedDistraction
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
            title="Hide decorative elements and simplify visual layout"
          >
            <Focus className="size-3.5" />
            Distraction-Free
          </button>

          {/* High contrast */}
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              highContrast
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
          >
            <Contrast className="size-3.5" />
            High Contrast
          </button>

          {/* Reading Ruler */}
          <button
            type="button"
            onClick={() => setReadingRuler(!readingRuler)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              readingRuler
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
            title="Toggle focus reading ruler (Alt+Up/Down to resize)"
          >
            <ScanLine className="size-3.5" />
            Reading Ruler
          </button>

          {/* Theme */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 px-3.5 py-1.5 text-xs text-stone-700 dark:text-stone-300 transition-all"
          >
            {theme === "dark" ? (
              <Sun className="size-3.5 text-amber-500" />
            ) : (
              <Moon className="size-3.5 text-stone-700" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {/* 3. Audio, Captions & Voice */}
      <div className="space-y-2.5">
        <span className="text-xs font-serif italic text-stone-500 tracking-wide uppercase font-semibold">
          Audio & Speech Assistance
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtitles */}
          <button
            type="button"
            onClick={() => setLiveCaptions(!liveCaptions)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
              liveCaptions
                ? "bg-[#7BD3C2] text-[#141817] font-semibold border border-[#191716] shadow-[1px_1px_0px_#141817]"
                : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            }`}
          >
            <Subtitles className="size-3.5" />
            Live Subtitles
          </button>

          {/* Read Aloud */}
          {tts.supported && (
            <button
              type="button"
              onClick={tts.state !== "idle" ? tts.stop : readPage}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all ${
                tts.state !== "idle"
                  ? "bg-destructive text-white font-semibold"
                  : "border border-stone-300 dark:border-stone-700 bg-card hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
              }`}
            >
              <Volume2 className="size-3.5" />
              {tts.state !== "idle" ? "Stop reading" : "Read page aloud"}
            </button>
          )}

          {/* Speech Rate */}
          <div className="inline-flex rounded-full border border-stone-300 dark:border-stone-700 p-0.5 bg-card items-center text-xs">
            <span className="px-2 text-stone-500 font-sans text-[11px]">Speed:</span>
            {([0.8, 1.0, 1.25] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTtsRate(r)}
                className={`rounded-full px-2.5 py-1 text-xs transition-all ${
                  ttsRate === r
                    ? "bg-[#7BD3C2] text-[#141817] font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:text-foreground"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>

          {/* Voice Control */}
          <button
            type="button"
            onClick={() => setVoiceAssistantOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#191716] bg-[#7BD3C2] px-3.5 py-1.5 text-xs font-semibold text-[#141817] shadow-[1px_1px_0px_#141817] transition-all hover:bg-[#6ec2b1]"
          >
            <Mic className="size-3.5" />
            Voice Control
          </button>
        </div>
      </div>

      {/* 4. Hand Gesture Navigation */}
      <div className="space-y-2.5">
        <span className="text-xs font-serif italic text-stone-500 tracking-wide uppercase font-semibold">
          Touchless & Motion Control
        </span>
        <GestureSettingsSection />
      </div>
    </div>
  );
}

/**
 * Dedicated Section component to embed on the Dashboard or Landing Page.
 */
export function AccessibilitySection({ className = "" }: { className?: string }) {
  return (
    <section
      aria-labelledby="a11y-section-heading"
      className={`rounded-2xl border border-[#191716]/15 dark:border-stone-800 bg-[#FAF7F2] dark:bg-[#1C1A18] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-[#191716]/10 dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#191716]/20 bg-[#7BD3C2]/20 px-3 py-0.5 text-xs font-serif italic text-stone-800 dark:text-stone-200 mb-2">
            <Accessibility className="size-3.5 text-[#191716] dark:text-stone-200" />
            <span>Multi-Modal Assistive Suite</span>
          </div>
          <h2
            id="a11y-section-heading"
            className="font-serif text-xl sm:text-2xl font-normal text-stone-900 dark:text-stone-100"
          >
            Accessibility & Adaptive Workspace
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-sans">
            Customize Ableo for your comfort — choose assistive disability presets, resize text,
            enable high contrast, activate reading ruler, or control via voice.
          </p>
        </div>
      </div>

      <AccessibilityControlsContent />
    </section>
  );
}

/**
 * Clean Slide-over Sheet / Drawer trigger for the Site Header.
 */
export function AccessibilitySheetTrigger() {
  const [open, setOpen] = useState(false);
  const { activePreset } = useAppState();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:border-foreground/40 active:scale-95 whitespace-nowrap"
          aria-label="Open accessibility and display preferences"
          title="Open accessibility preferences"
        >
          <Accessibility className="size-3.5 text-foreground" />
          <span className="font-sans font-semibold">A11y</span>
          {activePreset !== "custom" && (
            <span className="size-1.5 rounded-full bg-[#191716] dark:bg-white" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-[#FAF7F2] dark:bg-[#1C1A18] border-l border-border p-6"
      >
        <SheetHeader className="mb-6 pb-4 border-b border-border text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#7BD3C2] text-[#141817] font-bold text-xs">
              ♿
            </span>
            <SheetTitle className="font-serif text-xl font-normal text-foreground">
              Accessibility Settings
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-1 font-sans">
            Adjust visual contrast, font sizes, screen reading, reading ruler, and disability
            accommodation presets.
          </SheetDescription>
        </SheetHeader>

        <AccessibilityControlsContent inDrawer />
      </SheetContent>
    </Sheet>
  );
}

/**
 * Backward compatibility stub: does not render the disruptive top banner anymore.
 */
export function AccessibilityToolbar() {
  return null;
}
