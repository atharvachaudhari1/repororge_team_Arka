import { useState, type ReactNode } from "react";
import {
  Contrast,
  Eye,
  Hand,
  Ear,
  Brain,
  RotateCcw,
  Subtitles,
  Type,
  Moon,
  Sun,
  Accessibility,
  ScanLine,
  AlignJustify,
  Sliders,
  Check,
} from "lucide-react";
import {
  useAppState,
  type FontSize,
  type LineSpacing,
  type MotionPref,
  type AccessibilityPreset,
} from "@/lib/app-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const SIZES: { value: FontSize; label: string }[] = [
  { value: "medium", label: "Normal" },
  { value: "large", label: "Large" },
  { value: "x-large", label: "Extra Large" },
];

const LINE_SPACINGS: { value: LineSpacing; label: string }[] = [
  { value: "normal", label: "1x Standard" },
  { value: "relaxed", label: "1.8x Relaxed" },
  { value: "loose", label: "2.2x Loose" },
];

export function AccessibilitySection({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-brand" />
        <h3 className="font-sans text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="pt-1">{children}</div>
    </div>
  );
}

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
    activePreset,
    applyPreset,
    readingRuler,
    setReadingRuler,
    resetAccessibility,
  } = useAppState();

  return (
    <div className="space-y-5">
      {/* Active preset notification banner */}
      {activePreset !== "custom" && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded-xl border border-brand/40 bg-brand-soft/50 p-3 text-xs text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand animate-pulse" />
            <span className="font-medium capitalize">{activePreset} Preset Active</span>
          </div>
          <button
            type="button"
            onClick={resetAccessibility}
            className="text-[11px] underline hover:text-brand"
          >
            Reset
          </button>
        </div>
      )}

      {/* Quick Assistive Profiles */}
      <AccessibilitySection
        title="Assistive Profiles"
        icon={Sliders}
        description="Select a curated profile or customize controls individually below."
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activePreset === "blind" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("blind")}
            className="justify-start gap-2 h-9 text-xs"
          >
            <Eye className="size-3.5" />
            Vision / Blind
          </Button>
          <Button
            variant={activePreset === "motor" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("motor")}
            className="justify-start gap-2 h-9 text-xs"
          >
            <Hand className="size-3.5" />
            Motor / Mobility
          </Button>
          <Button
            variant={activePreset === "deaf" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("deaf")}
            className="justify-start gap-2 h-9 text-xs"
          >
            <Ear className="size-3.5" />
            Hearing / Deaf
          </Button>
          <Button
            variant={activePreset === "neurodivergent" ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset("neurodivergent")}
            className="justify-start gap-2 h-9 text-xs"
          >
            <Brain className="size-3.5" />
            Neurodivergent / ADHD
          </Button>
        </div>
      </AccessibilitySection>

      {/* Contrast & Theme */}
      <AccessibilitySection
        title="Color & Contrast (WCAG 2.2 AA)"
        icon={Contrast}
        description="Enhance text legibility with calibrated contrast ratios."
      >
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant={!highContrast && theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setHighContrast(false);
                if (theme === "dark") toggleTheme();
              }}
              className="flex-1 text-xs"
            >
              <Sun className="size-3.5 mr-1" />
              Warm Ivory
            </Button>
            <Button
              variant={!highContrast && theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setHighContrast(false);
                if (theme === "light") toggleTheme();
              }}
              className="flex-1 text-xs"
            >
              <Moon className="size-3.5 mr-1" />
              Dark Slate
            </Button>
          </div>
          <Button
            variant={highContrast ? "default" : "outline"}
            size="sm"
            onClick={() => setHighContrast((prev) => !prev)}
            className="w-full text-xs font-semibold"
          >
            <Contrast className="size-3.5 mr-1.5" />
            {highContrast ? "✓ High Contrast (Black & Yellow) Active" : "Enable High Contrast Mode"}
          </Button>
        </div>
      </AccessibilitySection>

      {/* Typography & Scaling */}
      <AccessibilitySection
        title="Text Scaling & Dyslexia Support"
        icon={Type}
        description="Adjust typography size and activate high-legibility dyslexic typefaces."
      >
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Text Size</span>
            <div className="grid grid-cols-3 gap-1.5">
              {SIZES.map((s) => (
                <Button
                  key={s.value}
                  variant={fontSize === s.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSize(s.value)}
                  className="text-xs"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground mb-1.5 block">Line Spacing</span>
            <div className="grid grid-cols-3 gap-1.5">
              {LINE_SPACINGS.map((l) => (
                <Button
                  key={l.value}
                  variant={lineSpacing === l.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLineSpacing(l.value)}
                  className="text-xs"
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant={dyslexiaFont ? "default" : "outline"}
            size="sm"
            onClick={() => setDyslexiaFont((prev) => !prev)}
            className="w-full text-xs"
          >
            {dyslexiaFont ? "✓ Dyslexia-Friendly Font Active" : "Enable Dyslexia-Friendly Font"}
          </Button>
        </div>
      </AccessibilitySection>

      {/* Cognitive & Focus Tools */}
      <AccessibilitySection
        title="Cognitive & Reading Focus"
        icon={AlignJustify}
        description="Tools to assist reading comprehension, reduce ADHD distractions, and suppress motion."
      >
        <div className="space-y-2">
          <Button
            variant={readingRuler ? "default" : "outline"}
            size="sm"
            onClick={() => setReadingRuler((prev) => !prev)}
            className="w-full justify-start text-xs"
          >
            <ScanLine className="size-3.5 mr-2" />
            {readingRuler ? "✓ Reading Ruler Active" : "Enable Reading Focus Ruler"}
          </Button>

          <Button
            variant={reducedDistraction ? "default" : "outline"}
            size="sm"
            onClick={() => setReducedDistraction((prev) => !prev)}
            className="w-full justify-start text-xs"
          >
            <Check className="size-3.5 mr-2" />
            {reducedDistraction ? "✓ Reduced Distraction Active" : "Reduce Visual Distractions & Shadows"}
          </Button>

          <Button
            variant={motion === "reduced" ? "default" : "outline"}
            size="sm"
            onClick={() => setMotion(motion === "reduced" ? "normal" : "reduced")}
            className="w-full justify-start text-xs"
          >
            <AlignJustify className="size-3.5 mr-2" />
            {motion === "reduced" ? "✓ Reduced Motion Active" : "Pause / Reduce UI Animations"}
          </Button>

          <Button
            variant={liveCaptions ? "default" : "outline"}
            size="sm"
            onClick={() => setLiveCaptions((prev) => !prev)}
            className="w-full justify-start text-xs"
          >
            <Subtitles className="size-3.5 mr-2" />
            {liveCaptions ? "✓ Live Captions Overlay Active" : "Enable Real-Time Live Captions"}
          </Button>
        </div>
      </AccessibilitySection>

      {/* Reset */}
      <div className="pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAccessibility}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5 mr-1.5" />
          Reset All Accessibility Settings to Default
        </Button>
      </div>
    </div>
  );
}

export function AccessibilitySheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open Accessibility Toolbar (WCAG Controls)"
          className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-all hover:bg-secondary hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Accessibility className="size-4 text-brand" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] overflow-y-auto p-6">
        <SheetHeader className="mb-5">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <Accessibility className="size-5 text-brand" />
            Accessibility &amp; Sensory Suite
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Customise contrast, text scaling, dyslexia support, focus guides, and assistive profiles.
          </SheetDescription>
        </SheetHeader>
        <AccessibilityControlsContent inDrawer={true} />
      </SheetContent>
    </Sheet>
  );
}

export function AccessibilityToolbar() {
  return (
    <div
      role="region"
      aria-label="Quick Accessibility Controls"
      className="fixed bottom-6 right-6 z-40 hidden md:block"
    >
      <AccessibilitySheetTrigger />
    </div>
  );
}
