import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  CheckCircle2,
  Clock,
  Compass,
  Contrast,
  Ear,
  Eye,
  Hand,
  HeartHandshake,
  Layers,
  Lock,
  Mic,
  Palette,
  ShieldCheck,
  Sliders,
  Sparkles,
  Type,
  Users,
  Volume2,
  Wand2,
} from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JobCardSkeleton } from "@/components/states";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const {
    theme,
    toggleTheme,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    dyslexiaFont,
    setDyslexiaFont,
    lineSpacing,
    setLineSpacing,
    reducedDistraction,
    setReducedDistraction,
    motion,
    setMotion,
    readingRuler,
    setReadingRuler,
  } = useAppState();

  const [sliderValue, setSliderValue] = useState([75]);
  const [switchChecked, setSwitchChecked] = useState(true);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
      {/* Skip Link target & Live Notification */}
      <div className="sr-only" aria-live="polite">
        Phase 1 Foundation and Accessible Design System Active.
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-background p-8 sm:p-12 md:p-16 text-center shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand-soft/70 px-4 py-1.5 text-xs font-semibold text-foreground mb-6">
          <Sparkles className="size-3.5 text-brand" />
          <span>Ableo • Phase 1 Foundation &amp; Design System Live</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Find Jobs Without Barriers.
        </h1>

        <p className="mt-5 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The accessibility-first employment platform designed from the ground up for people with
          disabilities and neurodivergent professionals — with transparent workplace accommodations and WCAG 2.2 AA compliance.
        </p>

        {/* Quick actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="rounded-full bg-[#7BD3C2] text-[#141817] font-semibold hover:bg-[#68c5b3] shadow-[2px_2px_0px_#141817] px-6"
            onClick={() => {
              const el = document.getElementById("design-system");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore Design System
            <ArrowRight className="size-4 ml-1.5" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full border-border bg-card/80 font-medium px-6"
            onClick={() => setHighContrast((prev) => !prev)}
          >
            <Contrast className="size-4 mr-2 text-brand" />
            {highContrast ? "Disable High Contrast" : "Toggle High Contrast"}
          </Button>
        </div>

        {/* Quick Accessibility Badges */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            WCAG 2.2 AA Contrast
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Full Screen Reader Support
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Dyslexia-Friendly Typography
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Keyboard First Navigation
          </span>
        </div>
      </section>

      {/* Live WCAG 2.2 Theme & Typography Playground */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand font-semibold text-xs tracking-wider uppercase">
              <Palette className="size-4" />
              Interactive Theme System
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
              Live Accessibility &amp; Contrast Sandbox
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Toggle any accessibility setting below and watch the entire application update in real time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contrast Card */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Contrast className="size-5 text-brand" />
                <CardTitle className="text-base font-semibold">Contrast &amp; Colors</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Supports Standard Warm Ivory, Dark Slate, and High-Contrast Black &amp; Yellow modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex gap-2">
                <Button
                  variant={!highContrast && theme === "light" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setHighContrast(false);
                    if (theme === "dark") toggleTheme();
                  }}
                >
                  Ivory
                </Button>
                <Button
                  variant={!highContrast && theme === "dark" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setHighContrast(false);
                    if (theme === "light") toggleTheme();
                  }}
                >
                  Dark
                </Button>
                <Button
                  variant={highContrast ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setHighContrast(true)}
                >
                  High Contrast
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current mode:{" "}
                <span className="font-semibold text-foreground">
                  {highContrast ? "High Contrast (oklch 21:1)" : theme === "dark" ? "Dark Slate" : "Warm Ivory"}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* Typography Scaling Card */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Type className="size-5 text-brand" />
                <CardTitle className="text-base font-semibold">Typography &amp; Scale</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Dynamically scale root font size across small, medium, large, and extra-large.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={fontSize === "medium" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setFontSize("medium")}
                >
                  Normal
                </Button>
                <Button
                  variant={fontSize === "large" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setFontSize("large")}
                >
                  Large
                </Button>
                <Button
                  variant={fontSize === "x-large" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setFontSize("x-large")}
                >
                  X-Large
                </Button>
              </div>
              <Button
                variant={dyslexiaFont ? "default" : "outline"}
                size="sm"
                className="w-full text-xs"
                onClick={() => setDyslexiaFont(!dyslexiaFont)}
              >
                {dyslexiaFont ? "✓ Dyslexia Font Active" : "Toggle Dyslexia-Friendly Font"}
              </Button>
            </CardContent>
          </Card>

          {/* Cognitive & Reading Card */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="size-5 text-brand" />
                <CardTitle className="text-base font-semibold">Reading Comfort</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Reduce visual clutter and increase line height for cognitive ease.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Relaxed Spacing</span>
                <Switch
                  checked={lineSpacing === "relaxed"}
                  onCheckedChange={(checked) => setLineSpacing(checked ? "relaxed" : "normal")}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Reading Focus Ruler</span>
                <Switch
                  checked={readingRuler}
                  onCheckedChange={(checked) => setReadingRuler(checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Reduced Distraction</span>
                <Switch
                  checked={reducedDistraction}
                  onCheckedChange={(checked) => setReducedDistraction(checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Radix UI Component Library Showcase */}
      <section id="design-system" className="space-y-6 pt-6">
        <div>
          <div className="flex items-center gap-2 text-brand font-semibold text-xs tracking-wider uppercase">
            <Layers className="size-4" />
            Accessible Component Primitives
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
            Ableo Design System Components
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            All 46 UI components are built with Radix primitives, Tailwind CSS tokens, and keyboard accessibility.
          </p>
        </div>

        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 max-w-xl mb-6">
            <TabsTrigger value="buttons">Buttons &amp; Badges</TabsTrigger>
            <TabsTrigger value="inputs">Controls &amp; Forms</TabsTrigger>
            <TabsTrigger value="dialogs">Modals &amp; Alerts</TabsTrigger>
            <TabsTrigger value="faq">Accordion &amp; FAQ</TabsTrigger>
          </TabsList>

          {/* Tab 1: Buttons & Badges */}
          <TabsContent value="buttons" className="space-y-6">
            <div className="surface-card p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Button Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive Action</Button>
                  <Button variant="link">Link Style</Button>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold mb-3">Accommodation &amp; Inclusion Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Screen Reader Verified</Badge>
                  <Badge variant="secondary">Wheelchair Friendly</Badge>
                  <Badge variant="outline">Flexible Hours</Badge>
                  <Badge variant="destructive">Deadline Approaching</Badge>
                  <Badge className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3]">
                    100% Accommodation Match
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                    Sensory Friendly Environment
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Controls & Forms */}
          <TabsContent value="inputs" className="space-y-6">
            <div className="surface-card p-6 rounded-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Interactive Slider</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Commute Distance Radius</span>
                      <span className="font-semibold text-foreground">{sliderValue[0]} km</span>
                    </div>
                    <Slider
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      max={100}
                      step={5}
                      className="py-2"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Accessibility Toggles</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Quiet Work Environment Guarantee</span>
                      <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">High Visual Contrast Preferred</span>
                      <Switch checked={highContrast} onCheckedChange={setHighContrast} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Dialogs & Alerts */}
          <TabsContent value="dialogs" className="space-y-6">
            <div className="surface-card p-6 rounded-2xl space-y-6">
              <Alert>
                <ShieldCheck className="size-4" />
                <AlertTitle className="text-sm font-semibold">Privacy First Guarantee</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground mt-1">
                  Ableo never assumes disability without consent. Medical and accommodation preferences remain
                  strictly candidate-controlled at all times.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-4 items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Accessible Dialog Preview</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display">Accessible Modal Dialog</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        This modal traps focus, restores focus upon dismissal, and announces its state via ARIA live regions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-sm text-foreground">
                      All dialog primitives conform to WAI-ARIA modal design patterns with full Escape key support.
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="w-full sm:w-auto">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Skeleton Loader Preview</h4>
                  <div className="w-full sm:w-80">
                    <JobCardSkeleton />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Accordion & FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <div className="surface-card p-6 rounded-2xl">
              <h3 className="text-base font-semibold mb-4">Frequently Asked Questions &amp; Legal Rights</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm font-medium">
                    What is India's RPwD Act 2016 obligation for private employers?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Under Section 21 of the Rights of Persons with Disabilities (RPwD) Act 2016, every establishment
                    is required to notify an Equal Opportunity Policy and provide reasonable workplace accommodations
                    without discrimination.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm font-medium">
                    How does Ableo protect candidate privacy?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Disability details, pronouns, and accommodation preferences are masked by default. Candidates choose
                    exactly what is disclosed to prospective employers, and match algorithms never penalize candidates for accommodation needs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-sm font-medium">
                    How does the hands-free navigation work?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Ableo includes the JARVIS voice command engine (with wake word recognition and clickable element numbering),
                    MediaPipe eye-gaze dwell clicking, and computer vision hand gesture recognition (implemented in Phase 5).
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Multi-Phase Implementation Roadmap Status */}
      <section className="space-y-6 rounded-3xl border border-border bg-card/60 p-8 sm:p-10">
        <div>
          <div className="flex items-center gap-2 text-brand font-semibold text-xs tracking-wider uppercase">
            <Clock className="size-4" />
            Project Execution Status
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
            Ableo Multi-Phase Roadmap
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tracking implementation across all 8 architectural phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Phase 1 */}
          <div className="rounded-2xl border-2 border-[#7BD3C2] bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#141817] bg-[#7BD3C2] px-2 py-0.5 rounded-full">
                PHASE 1
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Live
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Foundation &amp; Design System</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Vite, TypeScript, Tailwind CSS v4, WCAG 2.2 theme tokens, Radix UI component suite, and app shell layout.
            </p>
          </div>

          {/* Phase 2 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 2</span>
              <span className="text-xs text-muted-foreground">Next Up</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">State, Data Models &amp; Search</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Job listing schema, accommodation data, MongoDB connector, offline storage, and multi-attribute search filters.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 3</span>
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Job Discovery &amp; Transit Maps</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Job search view, detailed role view, Leaflet/Google Maps explorer, and wheelchair transit commute calculator.
            </p>
          </div>

          {/* Phase 4 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 4</span>
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Sensory &amp; Visual Suite</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Floating accessibility toolbar, Reading Ruler, Text-to-Speech audio reader, and live interview captions.
            </p>
          </div>

          {/* Phase 5 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 5</span>
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Hands-Free Assistive Systems</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              JARVIS voice navigation with element badges, MediaPipe eye-gaze tracking, and computer vision hand gestures.
            </p>
          </div>

          {/* Phase 6 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 6</span>
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">AI Engine &amp; Career GPS</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Google Gemini 2.5 Flash API + Ollama fallback, explainable "Ask AI Why" match scoring, and mock interview coach.
            </p>
          </div>

          {/* Phase 7 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 7</span>
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Resume Studio &amp; Applications</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              ATS-friendly resume builder, multi-step application wizard, accommodation brief, and candidate privacy vault.
            </p>
          </div>

          {/* Phase 8 */}
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">PHASE 8</span>
              <span className="text-xs text-muted-foreground">Queued</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">Auth, Employer Portal &amp; Tests</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              WebAuthn biometrics (Touch ID / Face ID), employer inclusion intelligence dashboard, and full Vitest / Cypress tests.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
