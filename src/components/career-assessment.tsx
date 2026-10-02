import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState, type CareerAssessment, type Profile } from "@/lib/app-state";
import { Sparkles, User, ArrowRight } from "lucide-react";

const INTEREST_OPTIONS = [
  "Building products",
  "Solving complex problems",
  "Working with data",
  "Designing user experiences",
  "Writing and communication",
  "Helping people directly",
  "Leading teams",
  "Starting a business",
  "Teaching and mentoring",
  "Research and innovation",
];

function buildAssessmentFromProfile(profile: Profile): CareerAssessment {
  return {
    education: profile.education,
    degree: "",
    skills: profile.skills,
    experience: profile.experience,
    interests: [],
    careerGoals: profile.careerInterests,
    preferredWorkMode: profile.workPreference,
    preferredLocation: profile.preferredLocation,
  };
}

export function CareerAssessmentForm({
  onComplete,
}: {
  onComplete: (assessment: CareerAssessment) => void;
}) {
  const { profile, careerAssessment, saveCareerAssessment } = useAppState();
  const [form, setForm] = useState<CareerAssessment>(
    careerAssessment ?? buildAssessmentFromProfile(profile),
  );

  const filledFields = [
    form.education,
    form.skills.length > 0,
    form.experience,
    form.interests.length > 0,
    form.careerGoals,
    form.preferredWorkMode,
  ].filter(Boolean).length;

  const completion = Math.round((filledFields / 7) * 100);

  const set = <K extends keyof CareerAssessment>(key: K, value: CareerAssessment[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleInterest = (interest: string) => {
    setForm((p) => ({
      ...p,
      interests: p.interests.includes(interest)
        ? p.interests.filter((i) => i !== interest)
        : [...p.interests, interest],
    }));
  };

  const handleSubmit = () => {
    saveCareerAssessment(form);
    onComplete(form);
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <User aria-hidden="true" className="size-5 text-brand" />
          Your Professional Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll use your existing profile information. Update any fields below if needed. This
          information is only used to generate your career recommendations.
        </p>
        <div className="mt-3">
          <Progress
            value={completion}
            className="h-2"
            aria-label={`Profile completion ${completion}%`}
          />
          <p className="mt-1 text-xs text-muted-foreground">{completion}% complete</p>
        </div>
      </div>

      <section className="surface-card space-y-4 p-5">
        <h3 className="text-base font-semibold">Education &amp; Skills</h3>
        <div>
          <label htmlFor="gps-education" className="block text-sm font-medium">
            Education
          </label>
          <Textarea
            id="gps-education"
            rows={2}
            className="mt-1.5"
            value={form.education}
            onChange={(e) => set("education", e.target.value)}
            placeholder="e.g. B.Tech in Computer Science, XYZ University"
          />
        </div>
        <div>
          <label htmlFor="gps-degree" className="block text-sm font-medium">
            Degree / Certification
          </label>
          <Input
            id="gps-degree"
            className="mt-1.5"
            value={form.degree}
            onChange={(e) => set("degree", e.target.value)}
            placeholder="e.g. B.Tech, BCA, MCA, MBA"
          />
        </div>
        <div>
          <label htmlFor="gps-skills" className="block text-sm font-medium">
            Skills
          </label>
          <Input
            id="gps-skills"
            className="mt-1.5"
            value={form.skills.join(", ")}
            onChange={(e) =>
              set(
                "skills",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="e.g. React, JavaScript, Python, SQL"
          />
          <p className="mt-1 text-xs text-muted-foreground">Separate skills with commas</p>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h3 className="text-base font-semibold">Experience</h3>
        <div>
          <label htmlFor="gps-experience" className="block text-sm font-medium">
            Work experience
          </label>
          <Textarea
            id="gps-experience"
            rows={3}
            className="mt-1.5"
            value={form.experience}
            onChange={(e) => set("experience", e.target.value)}
            placeholder="Describe your relevant work experience..."
          />
        </div>
        <div>
          <label htmlFor="gps-exp-band" className="block text-sm font-medium">
            Experience level
          </label>
          <Select
            {...(form.experience ? { value: form.experience } : {})}
            onValueChange={(v) => set("experience", v)}
          >
            <SelectTrigger id="gps-exp-band" className="mt-1.5">
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {["Fresher", "0-2 years", "2-5 years", "5+ years"].map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h3 className="text-base font-semibold">Interests &amp; Goals</h3>
        <div>
          <fieldset>
            <legend className="text-sm font-medium">What interests you?</legend>
            <p className="text-xs text-muted-foreground">
              Select all that apply — these help us find careers you'd enjoy.
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((interest) => {
                const id = `interest-${interest.replace(/\s+/g, "-")}`;
                return (
                  <li key={interest} className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={form.interests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                    />
                    <label htmlFor={id} className="text-sm">
                      {interest}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>
        <div>
          <label htmlFor="gps-goals" className="block text-sm font-medium">
            Career goals
          </label>
          <Textarea
            id="gps-goals"
            rows={2}
            className="mt-1.5"
            value={form.careerGoals}
            onChange={(e) => set("careerGoals", e.target.value)}
            placeholder="e.g. I want to work in frontend development, focusing on accessible interfaces"
          />
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <h3 className="text-base font-semibold">Work Preferences</h3>
        <div>
          <label htmlFor="gps-work-mode" className="block text-sm font-medium">
            Preferred work mode
          </label>
          <Select
            {...(form.preferredWorkMode ? { value: form.preferredWorkMode } : {})}
            onValueChange={(v) => set("preferredWorkMode", v)}
          >
            <SelectTrigger id="gps-work-mode" className="mt-1.5">
              <SelectValue placeholder="Select work mode" />
            </SelectTrigger>
            <SelectContent>
              {["Remote", "Hybrid", "On-site", "No preference"].map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="gps-location" className="block text-sm font-medium">
            Preferred location
          </label>
          <Input
            id="gps-location"
            className="mt-1.5"
            value={form.preferredLocation}
            onChange={(e) => set("preferredLocation", e.target.value)}
            placeholder="e.g. Bengaluru, Remote, Delhi NCR"
          />
        </div>
      </section>

      <p className="rounded-md border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
        This assessment collects professional information only. We never ask for or use disability
        identity, gender identity, pronouns, or any protected characteristics in career
        recommendations.
      </p>

      <Button onClick={handleSubmit} size="lg" className="min-h-11 w-full">
        <Sparkles aria-hidden="true" />
        Explore My Career Path
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}
