import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Compass,
  Gauge,
  MessageSquareText,
  Route as RouteIcon,
  ScanSearch,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { CareerAssessmentForm } from "@/components/career-assessment";
import { CareerDiscoveryResults } from "@/components/career-discovery";
import { SkillGapAnalysis } from "@/components/career-skill-gap";
import { CareerRoadmapUI } from "@/components/career-roadmap";
import { CareerReadiness } from "@/components/career-readiness";
import { PortfolioProjectCard } from "@/components/career-portfolio";
import { InterviewCoach } from "@/components/career-interview-coach";

export const Route = createFileRoute("/career-gps")({
  head: () => ({
    meta: [
      { title: "Career GPS — AccessPath" },
      {
        name: "description",
        content:
          "Discover where your skills can take you. AI career discovery, skill gap analysis, a personalised roadmap and matching inclusive jobs.",
      },
      { property: "og:title", content: "Career GPS — AccessPath" },
      {
        property: "og:description",
        content:
          "Discover where your skills can take you. AI career guidance connected directly to accessible jobs.",
      },
    ],
  }),
  component: CareerGPSPage,
});

type Stage = "welcome" | "assessment" | "journey";

const STEPS = [
  { id: "discovery", label: "Career Discovery", icon: Compass },
  { id: "skillgap", label: "Skill Gap", icon: ScanSearch },
  { id: "roadmap", label: "Roadmap", icon: RouteIcon },
  { id: "readiness", label: "Readiness", icon: Gauge },
  { id: "jobs", label: "Matching Jobs", icon: Briefcase },
] as const;

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section
      aria-labelledby="gps-welcome-heading"
      className="surface-card border-brand/30 bg-brand-soft p-8 text-center"
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
        <Compass aria-hidden="true" className="size-9" />
      </div>
      <h1 id="gps-welcome-heading" className="mt-5 text-3xl font-bold">
        Career GPS
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">Discover where your skills can take you.</p>

      <ol className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.id}
            className="flex items-start gap-2 rounded-md border border-border bg-background p-3"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {i + 1}
            </span>
            <span className="text-sm font-medium">{step.label}</span>
          </li>
        ))}
      </ol>

      <Button onClick={onStart} size="lg" className="mt-8 min-h-12 px-8 text-base">
        <Sparkles aria-hidden="true" />
        Explore My Career Path
        <ArrowRight aria-hidden="true" />
      </Button>

      <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
        A short assessment collects professional information only — education, skills, experience,
        interests and goals. We never ask for or use disability identity, gender identity or
        pronouns in career recommendations.
      </p>
    </section>
  );
}

function JourneyNav() {
  const { selectedCareer } = useAppState();
  return (
    <nav aria-label="Career GPS journey" className="surface-card p-4">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.id} className="flex items-center gap-1">
              {i > 0 && (
                <ArrowRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                  i === STEPS.length - 1
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-brand/10 text-brand"
                }`}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {selectedCareer ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Target aria-hidden="true" className="size-3.5" />
          Current target: <span className="font-medium text-foreground">{selectedCareer}</span>
        </p>
      ) : null}
    </nav>
  );
}

function Journey() {
  const navigate = useNavigate();
  const { selectedCareer } = useAppState();

  return (
    <div className="space-y-8">
      <JourneyNav />

      <section aria-labelledby="discovery-section">
        <h2 id="discovery-section" className="sr-only">
          Career discovery
        </h2>
        <CareerDiscoveryResults />
      </section>

      <section aria-labelledby="skillgap-section">
        <h2 id="skillgap-section" className="sr-only">
          Skill gap analysis
        </h2>
        <SkillGapAnalysis />
      </section>

      <section aria-labelledby="readiness-section">
        <h2 id="readiness-section" className="sr-only">
          Career readiness
        </h2>
        <CareerReadiness />
      </section>

      <section aria-labelledby="roadmap-section">
        <h2 id="roadmap-section" className="sr-only">
          30-day roadmap
        </h2>
        <CareerRoadmapUI />
      </section>

      <PortfolioProjectCard />

      <InterviewCoach />

      <section
        aria-labelledby="jobs-cta-section"
        className="surface-card border-brand/30 bg-brand-soft p-5"
      >
        <h2 id="jobs-cta-section" className="text-xl font-semibold">
          Take the next step into real roles
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your career path connects directly to the existing AccessPath job marketplace — with AI
          job match, Accessibility Fit, Before You Apply and privacy controls on every listing.
        </p>
        <Button asChild size="lg" className="mt-4 min-h-11">
          <Link to="/jobs" search={{ q: selectedCareer || "" }}>
            <Briefcase aria-hidden="true" />
            Find Matching Jobs
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

function CareerGPSPage() {
  const { careerAssessment, careerDiscoveries } = useAppState();
  const [stage, setStage] = useState<Stage>(
    careerDiscoveries.length > 0 ? "journey" : careerAssessment ? "assessment" : "welcome",
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {stage === "welcome" ? (
        <>
          <Welcome onStart={() => setStage("assessment")} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Want to see open roles first?{" "}
            <Link to="/jobs" search={{ q: "" }} className="font-medium text-brand hover:underline">
              Browse the job search
            </Link>
            .
          </p>
        </>
      ) : stage === "assessment" ? (
        <>
          <header>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Compass aria-hidden="true" className="size-7 text-brand" />
              Career assessment
            </h1>
            <p className="mt-2 text-muted-foreground">
              We've prefilled this from your existing profile. Review, add anything missing, then
              explore your career path.
            </p>
          </header>
          <div className="mt-6">
            <CareerAssessmentForm onComplete={() => setStage("journey")} />
          </div>
        </>
      ) : (
        <>
          <header>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Compass aria-hidden="true" className="size-7 text-brand" />
              Career GPS
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your personalised path from skills to employment.
            </p>
          </header>
          <div className="mt-6">
            <Journey />
          </div>
        </>
      )}
    </div>
  );
}
