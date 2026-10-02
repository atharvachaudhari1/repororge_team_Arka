import { useState } from "react";
import {
  Contrast,
  Eye,
  Hand,
  Ear,
  Brain,
  Mic,
  RotateCcw,
  Settings2,
  Subtitles,
  Type,
  Volume2,
  Waves,
  X,
  BookOpen,
  Moon,
  Sun,
} from "lucide-react";
import { useAppState, type FontSize, type MotionPref, type AccessibilityPreset } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { useTextToSpeech } from "@/lib/speech";

const SIZES: { value: FontSize; label: string }[] = [
  { value: "medium", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "Extra large" },
];

const MOTIONS: { value: MotionPref; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "reduced", label: "Reduced" },
];

function Group({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <span id={id} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap items-center gap-1">
        {children}
      </div>
    </div>
  );
}

export function AccessibilityToolbar() {
  const {
    theme,
    toggleTheme,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
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
  } = useAppState();

  const [open, setOpen] = useState(false);
  const tts = useTextToSpeech();

  const readPage = () => {
    const main = document.getElementById("main");
    const text = (main?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000);
    if (text) {
      setCaptionText(text.slice(0, 250));
      tts.play(text);
    }
  };

  return (
    <section
      aria-label="Display and accessibility settings"
      className="border-b border-border bg-secondary/70 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex items-center justify-between gap-3 sm:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-success" />
            <p className="text-xs font-medium">Ableo Accessibility Suite</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="size-3.5 text-warning" /> : <Moon className="size-3.5 text-brand" />}
              <span className="sr-only sm:not-sr-only">{theme === "dark" ? "Light" : "Dark"}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={() => setVoiceAssistantOpen(true)}
              aria-label="Open voice control assistant"
            >
              <Mic className="size-3.5 text-brand" />
              Voice
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              aria-expanded={open}
              aria-controls="a11y-controls"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X aria-hidden="true" className="size-3.5" /> : <Settings2 aria-hidden="true" className="size-3.5" />}
              {open ? "Close" : "A11y Bar"}
            </Button>
          </div>
        </div>

        <div
          id="a11y-controls"
          className={`${open ? "flex" : "hidden"} flex-col gap-3 pt-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pt-0`}
        >
          {/* Disability Presets */}
          <Group label="Disability Profiles" id="a11y-presets">
            <Button
              type="button"
              size="sm"
              variant={activePreset === "blind" ? "default" : "outline"}
              className="h-8 gap-1 text-xs"
              onClick={() => applyPreset("blind")}
              aria-label="Blind or Low Vision mode"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              Vision
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activePreset === "motor" ? "default" : "outline"}
              className="h-8 gap-1 text-xs"
              onClick={() => applyPreset("motor")}
              aria-label="Motor or Mobility mode"
            >
              <Hand className="size-3.5" aria-hidden="true" />
              Motor
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activePreset === "deaf" ? "default" : "outline"}
              className="h-8 gap-1 text-xs"
              onClick={() => applyPreset("deaf")}
              aria-label="Deaf or Hard of Hearing mode"
            >
              <Ear className="size-3.5" aria-hidden="true" />
              Hearing
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activePreset === "cognitive" ? "default" : "outline"}
              className="h-8 gap-1 text-xs"
              onClick={() => applyPreset("cognitive")}
              aria-label="Neurodivergent or Focus mode"
            >
              <Brain className="size-3.5" aria-hidden="true" />
              Focus
            </Button>
            {activePreset !== "custom" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => applyPreset("custom")}
                aria-label="Reset accessibility preset"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                Reset
              </Button>
            ) : null}
          </Group>

          {activePreset === "blind" ? (
            <p role="status" className="text-xs text-muted-foreground">
              Vision mode active: high contrast, extra-large text, and reduced motion.
            </p>
          ) : null}

          {/* Granular Accessibility Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <Group label="Text" id="a11y-size">
              <Type aria-hidden="true" className="size-3.5 self-center text-muted-foreground" />
              {SIZES.map((s) => (
                <Button
                  key={s.value}
                  type="button"
                  size="sm"
                  variant={fontSize === s.value ? "default" : "outline"}
                  aria-pressed={fontSize === s.value}
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setFontSize(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </Group>

            <Group label="Theme" id="a11y-theme">
              <Button
                type="button"
                size="sm"
                variant={theme === "dark" ? "default" : "outline"}
                aria-pressed={theme === "dark"}
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Moon aria-hidden="true" className="size-3.5 text-cyan-400" /> : <Sun aria-hidden="true" className="size-3.5 text-amber-500" />}
                {theme === "dark" ? "Dark" : "Light"}
              </Button>
            </Group>

            <Group label="Contrast" id="a11y-contrast">
              <Button
                type="button"
                size="sm"
                variant={highContrast ? "default" : "outline"}
                aria-pressed={highContrast}
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => setHighContrast(!highContrast)}
              >
                <Contrast aria-hidden="true" className="size-3.5" />
                {highContrast ? "High On" : "Contrast"}
              </Button>
            </Group>

            <Group label="Dyslexia" id="a11y-dyslexia">
              <Button
                type="button"
                size="sm"
                variant={dyslexiaFont ? "default" : "outline"}
                aria-pressed={dyslexiaFont}
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => setDyslexiaFont(!dyslexiaFont)}
              >
                <BookOpen aria-hidden="true" className="size-3.5" />
                {dyslexiaFont ? "Font On" : "Dyslexia"}
              </Button>
            </Group>

            <Group label="Captions" id="a11y-captions">
              <Button
                type="button"
                size="sm"
                variant={liveCaptions ? "default" : "outline"}
                aria-pressed={liveCaptions}
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => setLiveCaptions(!liveCaptions)}
              >
                <Subtitles aria-hidden="true" className="size-3.5" />
                {liveCaptions ? "Subtitles On" : "Subtitles"}
              </Button>
            </Group>

            <Group label="Audio & Voice" id="a11y-reading">
              {tts.supported ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2.5 text-xs"
                    onClick={readPage}
                  >
                    <Volume2 aria-hidden="true" className="size-3.5" />
                    Read aloud
                  </Button>
                  {tts.state !== "idle" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs"
                      onClick={tts.stop}
                    >
                      Stop
                    </Button>
                  ) : null}
                </>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-brand/50 px-2.5 text-xs font-semibold text-brand hover:bg-brand/10"
                onClick={() => setVoiceAssistantOpen(true)}
              >
                <Mic aria-hidden="true" className="size-3.5" />
                Voice Control
              </Button>
            </Group>
          </div>
        </div>
      </div>
    </section>
  );
}
