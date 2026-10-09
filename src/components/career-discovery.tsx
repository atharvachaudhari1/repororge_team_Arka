import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Compass,
  Loader2,
  Map,
  Sparkles,
  Target,
} from "lucide-react";
import { useAppState, type CareerPathRecommendation } from "@/lib/app-state";
import { generateCareerDiscoveries } from "@/lib/ai.functions";

function CareerCard({
  career,
  onSelect,
  isSelected,
}: {
  career: CareerPathRecommendation;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const tone =
    career.fitScore >= 85
      ? "border-success/40 bg-success/5"
      : career.fitScore >= 70
        ? "border-brand/30 bg-brand/5"
        : "border-border";

  return (
    <article
      className={`surface-card p-5 transition-colors ${tone} ${
        isSelected ? "ring-2 ring-brand" : ""
      }`}
      aria-labelledby={`career-${career.title.replace(/\s+/g, "-")}-title`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            id={`career-${career.title.replace(/\s+/g, "-")}-title`}
            className="text-lg font-semibold"
          >
            {career.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{career.why}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand">{career.fitScore}%</p>
          <p className="text-xs text-muted-foreground">Potential Fit</p>
        </div>
      </div>

      <div className="mt-4">
        <Progress
          value={career.fitScore}
          className="h-2"
          aria-label={`${career.title} potential fit ${career.fitScore}%`}
        />
      </div>

      {career.relevantSkills.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium">Relevant skills you have</h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {career.relevantSkills.map((skill) => (
              <li
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
              >
                <CheckCircle2 aria-hidden="true" className="size-3" />
                {skill}
              </li>
            ))}
          </ul>
        </div>
      )}

      {career.skillsToDevelop.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium">Skills to develop</h4>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {career.skillsToDevelop.map((skill) => (
              <li
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
              >
                <AlertTriangle aria-hidden="true" className="size-3" />
                {skill}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Next step:</span> {career.nextAction}
        </p>
        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          className="min-h-11"
          onClick={onSelect}
          aria-pressed={isSelected}
        >
          {isSelected ? "Selected" : "Explore"}
        </Button>
      </div>
    </article>
  );
}

export function CareerDiscoveryResults() {
  const {
    profile,
    careerAssessment,
    careerDiscoveries,
    setCareerDiscoveries,
    selectedCareer,
    setSelectedCareer,
    setSkillGap,
    setRoadmap,
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useServerFn(generateCareerDiscoveries);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: {
          profile: {
            name: profile.name,
            headline: profile.headline,
            skills: profile.skills,
            education: profile.education,
            experience: profile.experience,
            experienceBand: profile.experienceBand,
            careerInterests: profile.careerInterests,
            certifications: profile.certifications,
            preferredLocation: profile.preferredLocation,
            workPreference: profile.workPreference,
          },
          additionalInfo: {
            interests: careerAssessment?.interests ?? [],
            careerGoals: careerAssessment?.careerGoals ?? profile.careerInterests,
          },
        },
      });
      if (res.ok) {
        setCareerDiscoveries(res.careers);
      } else {
        setError(res.error);
      }
    } catch {
      setError("AI recommendations are temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  if (careerDiscoveries.length === 0 && !loading && !error) {
    return (
      <div className="surface-card p-6 text-center">
        <Compass aria-hidden="true" className="mx-auto size-10 text-brand" />
        <h2 className="mt-3 text-xl font-semibold">Discover Your Career Paths</h2>
        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          Based on your assessment, we'll use AI to recommend 3-5 career paths that match your
          skills, interests and goals.
        </p>
        <Button onClick={handleGenerate} size="lg" className="mt-6 min-h-11">
          <Sparkles aria-hidden="true" />
          Generate Career Recommendations
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          AI-generated career analysis — uses your professional information only. Not an official
          qualification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="surface-card p-8 text-center">
          <Loader2 aria-hidden="true" className="mx-auto size-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">
            Analysing your profile and generating career recommendations...
          </p>
          <p className="mt-1 text-xs text-muted-foreground">This usually takes a few seconds.</p>
        </div>
      )}

      {error && (
        <div className="surface-card border-destructive/30 bg-destructive/5 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle aria-hidden="true" className="size-5" />
            AI recommendations are temporarily unavailable.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={handleGenerate} variant="outline" className="mt-3 min-h-11">
            Try again
          </Button>
        </div>
      )}

      {!loading && careerDiscoveries.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Your Career Paths</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                AI-generated recommendations based on your professional profile. "Potential Fit" is
                not an employability score.
              </p>
            </div>
            <Button onClick={handleGenerate} variant="outline" size="sm" className="min-h-11">
              Regenerate
            </Button>
          </div>

          <ul className="space-y-4">
            {careerDiscoveries.map((career) => (
              <li key={career.title}>
                <CareerCard
                  career={career}
                  isSelected={selectedCareer === career.title}
                  onSelect={() => setSelectedCareer(career.title)}
                />
              </li>
            ))}
          </ul>

          {selectedCareer && (
            <div className="surface-card border-brand/30 bg-brand-soft p-5">
              <h3 className="font-semibold">Ready for next steps with {selectedCareer}?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyse your skill gap, build a learning roadmap, or find matching jobs.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" className="min-h-11">
                  <Link to="/jobs" search={{ q: selectedCareer }}>
                    <Briefcase aria-hidden="true" />
                    Find Matching Jobs
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            AI-generated career analysis. Scores reflect alignment with your stated professional
            profile, not employability. Never uses disability, gender identity, pronouns, or
            protected characteristics.
          </p>
        </>
      )}
    </div>
  );
}
