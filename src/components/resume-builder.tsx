import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppState, type Profile } from "@/lib/app-state";
import { extractResumeText } from "@/lib/resume-file";
import { parseResumeText, type ParsedResume } from "@/lib/resume-parser";

type QuestionKey =
  | "name"
  | "headline"
  | "email"
  | "preferredLocation"
  | "skills"
  | "education"
  | "experience"
  | "certifications";

type ResumeQuestion = {
  key: QuestionKey;
  title: string;
  prompt: string;
  hint: string;
  multiline?: boolean;
};

const QUESTIONS: ResumeQuestion[] = [
  {
    key: "name",
    title: "Your name",
    prompt: "What name should appear at the top of your resume?",
    hint: "Use the name you want employers to see.",
  },
  {
    key: "headline",
    title: "Professional headline",
    prompt: "What kind of role are you looking for, or what is your professional identity?",
    hint: "Example: Frontend developer building accessible web experiences.",
  },
  {
    key: "email",
    title: "Contact email",
    prompt: "What is the best email address for employers to contact you?",
    hint: "This is optional, but a resume is stronger with a contact method.",
  },
  {
    key: "preferredLocation",
    title: "Location",
    prompt: "What city or region should we show on the resume?",
    hint: "Example: Mumbai, Maharashtra or Remote, India.",
  },
  {
    key: "skills",
    title: "Skills",
    prompt: "What tools, technologies, or professional skills should we highlight?",
    hint: "Separate them with commas, for example: React, TypeScript, WCAG, Figma.",
  },
  {
    key: "education",
    title: "Education",
    prompt: "Tell me about your degree, institution, or relevant training.",
    hint: "Include the course, institution, and graduation year if you want.",
    multiline: true,
  },
  {
    key: "experience",
    title: "Experience and projects",
    prompt: "Tell me about a role, internship, project, or achievement you are proud of.",
    hint: "Mention what you did, tools you used, and the result. Bullet points work well.",
    multiline: true,
  },
  {
    key: "certifications",
    title: "Certifications",
    prompt: "Do you have certifications, courses, or awards to include?",
    hint: "You can skip this one if it does not apply.",
    multiline: true,
  },
];

function buildResumeText(profile: Profile) {
  return [
    profile.displayName || profile.name,
    profile.headline,
    [profile.email, profile.preferredLocation, profile.workPreference].filter(Boolean).join(" | "),
    profile.skills.length ? `SKILLS\n${profile.skills.join(", ")}` : "",
    profile.experience ? `EXPERIENCE\n${profile.experience}` : "",
    profile.education ? `EDUCATION\n${profile.education}` : "",
    profile.certifications ? `CERTIFICATIONS\n${profile.certifications}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function answerFor(profile: Profile, key: QuestionKey) {
  return key === "skills" ? profile.skills.join(", ") : profile[key] || "";
}

function skillsFromAnswer(value: string) {
  const withoutIntro = value
    .trim()
    .replace(
      /^(?:i(?:'m| am)?\s+)?(?:know|use|work with|am skilled in|have experience with)\s+/i,
      "",
    );

  return Array.from(
    new Set(
      withoutIntro
        .replace(/\s+(?:and|&)\s+/gi, ",")
        .split(/[,;\n•|]+/)
        .map((skill) =>
          skill
            .trim()
            .replace(/^[-–—]\s*/, "")
            .replace(/[.]+$/, ""),
        )
        .filter(Boolean),
    ),
  );
}

function withAnswer(profile: Profile, key: QuestionKey, answer: string): Profile {
  const value = answer.trim();
  if (key === "skills") return { ...profile, skills: skillsFromAnswer(value) };

  return {
    ...profile,
    [key]: value,
    ...(key === "name" && !profile.displayName ? { displayName: value } : {}),
  };
}

function firstUnansweredQuestion(profile: Profile) {
  const index = QUESTIONS.findIndex((item) => !answerFor(profile, item.key));
  return index === -1 ? QUESTIONS.length : index;
}

function applyParsedResume(profile: Profile, parsed: ParsedResume, fileName: string): Profile {
  const next = {
    ...profile,
    name: parsed.name || profile.name,
    displayName: parsed.name || profile.displayName,
    headline: parsed.headline || profile.headline,
    email: parsed.email || profile.email,
    skills: Array.from(new Set([...profile.skills, ...parsed.skills])),
    education: parsed.education || profile.education,
    experience: parsed.experience || profile.experience,
    experienceBand: parsed.experienceBand || profile.experienceBand,
    careerInterests: parsed.careerInterests || profile.careerInterests,
    certifications: parsed.certifications || profile.certifications,
    preferredLocation: parsed.preferredLocation || profile.preferredLocation,
    workPreference: parsed.workPreference || profile.workPreference,
    resumeName: fileName,
  } satisfies Profile;

  return { ...next, resumeText: parsed.rawText || buildResumeText(next) };
}

export function ResumeBuilder() {
  const { profile, saveProfile } = useAppState();
  const [draft, setDraft] = useState<Profile>(profile);
  const [questionIndex, setQuestionIndex] = useState(() => firstUnansweredQuestion(profile));
  const [answer, setAnswer] = useState(() => {
    const firstQuestion = QUESTIONS[firstUnansweredQuestion(profile)];
    return firstQuestion ? answerFor(profile, firstQuestion.key) : "";
  });
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const question = QUESTIONS[questionIndex];
  const progress = Math.round((questionIndex / QUESTIONS.length) * 100);
  const liveDraft = useMemo(
    () => (question ? withAnswer(draft, question.key, answer) : draft),
    [answer, draft, question],
  );
  const resumeText = useMemo(() => buildResumeText(liveDraft), [liveDraft]);

  useEffect(() => {
    if (isEditing) return;
    const nextIndex = firstUnansweredQuestion(profile);
    setDraft(profile);
    setQuestionIndex(nextIndex);
    setAnswer(nextIndex < QUESTIONS.length ? answerFor(profile, QUESTIONS[nextIndex]!.key) : "");
  }, [isEditing, profile]);

  const moveTo = (nextIndex: number, nextDraft = draft) => {
    setQuestionIndex(nextIndex);
    const nextQuestion = QUESTIONS[nextIndex];
    setAnswer(nextQuestion ? answerFor(nextDraft, nextQuestion.key) : "");
  };

  const saveAnswer = () => {
    if (!question) return;
    setIsEditing(true);
    const nextDraft = liveDraft;

    setDraft(nextDraft);
    moveTo(Math.min(questionIndex + 1, QUESTIONS.length), nextDraft);
  };

  const handleUpload = async (file: File) => {
    setIsEditing(true);
    setIsUploading(true);
    try {
      const rawText = await extractResumeText(file);
      const parsed = parseResumeText(rawText, file.name);
      const nextDraft = applyParsedResume(draft, parsed, file.name);
      setDraft(nextDraft);
      const nextIndex = QUESTIONS.findIndex((item) => !answerFor(nextDraft, item.key));
      moveTo(nextIndex === -1 ? QUESTIONS.length : nextIndex, nextDraft);
      toast.success("Resume imported. Janvi will ask only for missing details.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that resume.");
    } finally {
      setIsUploading(false);
    }
  };

  const finish = () => {
    const finalProfile: Profile = {
      ...draft,
      resumeName:
        draft.resumeName ||
        `${(draft.displayName || draft.name || "My").replace(/\s+/g, "_")}_Resume`,
      resumeText,
    };
    setDraft(finalProfile);
    saveProfile(finalProfile);
    setSaved(true);
    toast.success("Your resume draft has been saved to your Ableo profile.");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="max-w-3xl">
        <Badge variant="outline" className="border-brand/40 bg-brand/5 text-brand">
          <Sparkles className="mr-1.5 size-3.5" /> Janvi Resume Builder
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Build your resume, one answer at a time.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload an existing resume to start from it, or let Janvi ask short questions and create a
          clean, ATS-friendly draft as you answer.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                <Upload className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Already have a resume?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a PDF, DOCX, or TXT file. Its details are read in the browser and used to
                  prefill the builder; Janvi only asks about the gaps.
                </p>
              </div>
            </div>
            <label
              htmlFor="resume-builder-upload"
              className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand/60 bg-background px-4 py-3 text-sm font-semibold text-brand hover:bg-brand/5"
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isUploading ? "Reading resume…" : "Upload existing resume"}
            </label>
            <input
              id="resume-builder-upload"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="sr-only"
              disabled={isUploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            {question ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                    Janvi asks · {questionIndex + 1} of {QUESTIONS.length}
                  </p>
                  <span className="text-xs text-muted-foreground">{progress}% complete</span>
                </div>
                <Progress value={progress} className="mt-2" />
                <h2 className="mt-5 text-xl font-semibold">{question.prompt}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{question.hint}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use your own words—full sentences, short notes, or bullet points are all fine.
                </p>
                <div className="mt-4">
                  {question.multiline ? (
                    <Textarea
                      value={answer}
                      onChange={(event) => {
                        setIsEditing(true);
                        setAnswer(event.target.value);
                      }}
                      rows={6}
                      placeholder="Type or dictate your answer…"
                      aria-label={question.title}
                    />
                  ) : (
                    <Input
                      value={answer}
                      onChange={(event) => {
                        setIsEditing(true);
                        setAnswer(event.target.value);
                      }}
                      placeholder="Type or dictate your answer…"
                      aria-label={question.title}
                    />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={saveAnswer} className="gap-1.5">
                    Continue <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(true);
                      moveTo(questionIndex + 1);
                    }}
                  >
                    Skip for now
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
                  <Check className="size-6" />
                </span>
                <h2 className="mt-3 text-xl font-semibold">Your resume draft is ready.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review it on the right, then save it to use for matching and applications.
                </p>
                <Button type="button" className="mt-4 gap-1.5" onClick={finish}>
                  <FileText className="size-4" />{" "}
                  {saved ? "Saved to profile" : "Save resume to profile"}
                </Button>
                {saved && (
                  <Button type="button" variant="outline" className="mt-2" asChild>
                    <Link to="/profile">Review or export resume</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Live resume preview"
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-semibold">Live resume preview</h2>
              <p className="text-xs text-muted-foreground">Updates as you type</p>
            </div>
            <Badge variant="secondary">ATS-friendly</Badge>
          </div>
          <article className="mt-5 space-y-5 text-sm">
            <header>
              <h3 className="text-2xl font-bold">
                {liveDraft.displayName || liveDraft.name || "Your name"}
              </h3>
              <p className="mt-1 font-medium text-brand">
                {liveDraft.headline || "Your professional headline"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {[liveDraft.email, liveDraft.preferredLocation, liveDraft.workPreference]
                  .filter(Boolean)
                  .join(" · ") || "Contact details will appear here"}
              </p>
            </header>

            <ResumePreviewSection title="Skills">
              {liveDraft.skills.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {liveDraft.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <PreviewEmpty text="Add skills to make your strengths easy to scan." />
              )}
            </ResumePreviewSection>
            <ResumePreviewSection title="Experience & projects">
              {liveDraft.experience ? (
                <p className="whitespace-pre-wrap">{liveDraft.experience}</p>
              ) : (
                <PreviewEmpty text="Your roles, projects, and achievements will appear here." />
              )}
            </ResumePreviewSection>
            <ResumePreviewSection title="Education">
              {liveDraft.education ? (
                <p className="whitespace-pre-wrap">{liveDraft.education}</p>
              ) : (
                <PreviewEmpty text="Your education and training will appear here." />
              )}
            </ResumePreviewSection>
            {liveDraft.certifications && (
              <ResumePreviewSection title="Certifications & awards">
                <p className="whitespace-pre-wrap">{liveDraft.certifications}</p>
              </ResumePreviewSection>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}

function ResumePreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function PreviewEmpty({ text }: { text: string }) {
  return <p className="text-sm italic text-muted-foreground">{text}</p>;
}
