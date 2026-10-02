import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Mic, Send, Square, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState, type Profile } from "@/lib/app-state";
import type { Job } from "@/lib/jobs-data";
import { ACCESS_FEATURES } from "@/lib/jobs-data";
import { rankJobs, averageMatch, scoreJob } from "@/lib/matching";
import { useTextToSpeech, useVoiceSearch } from "@/lib/speech";

type Msg = { id: number; role: "user" | "assistant"; text: string; jobIds?: string[] };

const SUGGESTIONS = [
  "Which jobs should I apply for?",
  "Why am I only getting 70% matches?",
  "What skills am I missing?",
  "How can I improve my resume?",
  "Find remote jobs suitable for my profile.",
  "Read this job description to me.",
];

function answer(q: string, profile: Profile, jobs: Job[]): { text: string; jobIds?: string[] } {
  const t = q.toLowerCase();
  const ranked = rankJobs(profile, jobs, 5);
  const top = ranked[0];
  const name = profile.name ? profile.name.split(" ")[0] : "there";

  if (!profile.skills.length && !profile.headline) {
    return {
      text: `Hi ${name}. I work from your profile, and it looks empty right now. Add your skills, experience level, career interests and work preference on the Profile page and I can explain your matches precisely.`,
    };
  }

  if (/remote/.test(t)) {
    const remote = rankJobs(
      profile,
      jobs.filter((j) => j.workMode === "Remote"),
      3,
    );
    return {
      text: remote.length
        ? `Here are the remote roles that fit your profile best: ${remote
            .map((m) => `${m.job.title} at ${m.job.company} (${m.total}% match)`)
            .join("; ")}.`
        : "I could not find remote roles in the current listings.",
      jobIds: remote.map((m) => m.job.id),
    };
  }

  if (/read .*(job|description)|read (it|this) (aloud|to me)/.test(t)) {
    if (!top) return { text: "I need at least one job listing to read out." };
    const j = top.job;
    return {
      text: `${j.title} at ${j.company}. ${j.workMode} role in ${j.city}, ${j.employment}, ${j.experience} experience. ${j.about} Required skills: ${j.requiredSkills.join(", ")}. Accessibility, ${j.accessSource.toLowerCase()}: ${j.access.map((a) => ACCESS_FEATURES[a]).join(", ")}. Use the Listen button on the job page to hear the full listing, or the speaker button here to hear this answer.`,
      jobIds: [j.id],
    };
  }

  if (/missing|skill gap|which skills/.test(t)) {
    const gaps = new Map<string, number>();
    ranked.forEach((m) => m.missingRequired.forEach((s) => gaps.set(s, (gaps.get(s) ?? 0) + 1)));
    const list = [...gaps.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([s]) => s);
    return {
      text: list.length
        ? `Across your top matches, the skills that come up most and are missing from your profile are ${list.join(", ")}. Adding evidence for even one of them lifts several match scores.`
        : "Your profile already covers the required skills for your top matches. Focus on tailoring your resume wording next.",
      jobIds: ranked.slice(0, 2).map((m) => m.job.id),
    };
  }

  if (/why|70%|score|match/.test(t) && top) {
    return {
      text: `Your top match is ${top.job.title} at ${top.job.company} at ${top.total}%. The breakdown is skills ${top.skills}%, experience ${top.experience}%, career goal ${top.career}%, work preference ${top.workPreference}%. ${top.missingRequired.length ? `The score is held back mainly by ${top.missingRequired.slice(0, 2).join(" and ")}.` : "Nothing major is missing."} Your average across the top five roles is ${averageMatch(profile, jobs)}%. Scores never consider disability or gender identity — only job-related evidence.`,
      jobIds: [top.job.id],
    };
  }

  if (/resume/.test(t)) {
    const missing = top?.missingRequired ?? [];
    return {
      text: `Open Resume match, paste your resume and pick a role. ${missing.length ? `For ${top?.job.title}, make sure your resume evidences ${missing.slice(0, 3).join(", ")}.` : "Then mirror the job's own wording in your summary line and quantify each bullet."} Every bullet should show action, tool and measurable result.`,
      ...(top ? { jobIds: [top.job.id] } : {}),
    };
  }

  if (/apply|which jobs|recommend/.test(t)) {
    return {
      text: ranked.length
        ? `Based on your profile I would apply to: ${ranked
            .slice(0, 3)
            .map((m) => `${m.job.title} at ${m.job.company} (${m.total}%)`)
            .join(
              "; ",
            )}. Start with the highest match, and check the accessibility information on each listing before applying.`
        : "There are no listings to recommend yet.",
      jobIds: ranked.slice(0, 3).map((m) => m.job.id),
    };
  }

  if (top) {
    const m = scoreJob(profile, top.job);
    return {
      text: `I can help with matches, missing skills, resume improvements and finding roles by work mode. Right now your strongest fit is ${m.job.title} at ${m.job.company} (${m.total}% match). Try one of the suggested questions below.`,
      jobIds: [m.job.id],
    };
  }
  return { text: "Ask me about your matches, missing skills or resume." };
}

export function CareerAssistant() {
  const { profile, allJobs, findJob } = useAppState();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hello, I'm your AccessPath career assistant. I use your profile and the current listings to explain your matches. Ask me anything, or pick a question below.",
    },
  ]);
  const nextId = useRef(1);
  const tts = useTextToSpeech();
  const voice = useVoiceSearch((text) => {
    setInput(text);
    send(text);
  });

  const jobs = useMemo(() => allJobs, [allJobs]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    const a = answer(q, profile, jobs);
    setMsgs((prev) => [
      ...prev,
      { id: nextId.current++, role: "user", text: q },
      {
        id: nextId.current++,
        role: "assistant",
        text: a.text,
        ...(a.jobIds ? { jobIds: a.jobIds } : {}),
      },
    ]);
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-2xl border-2 border-[#191716] bg-[#FFFDF9] dark:bg-[#201E1C] p-2.5 shadow-[3px_3px_0px_#191716] hover:-translate-y-0.5 active:translate-y-0 transition-transform"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="career-assistant-panel"
      >
        <span className="flex size-8 items-center justify-center rounded-full border border-[#191716] bg-[#E8F7F4] text-xs font-serif font-bold text-[#141817]">
          An
        </span>
        <div className="text-left pr-1 hidden sm:block">
          <p className="text-[9px] uppercase font-serif tracking-widest text-stone-500 leading-none">
            Chat with
          </p>
          <p className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">Angie</p>
        </div>
        <span className="rounded-full border border-[#191716] bg-[#7BD3C2] px-2.5 py-0.5 text-[11px] font-semibold text-[#141817]">
          Let's Chat!
        </span>
      </button>

      {open ? (
        <aside
          id="career-assistant-panel"
          aria-label="AI career assistant"
          className="fixed inset-x-2 bottom-2 z-50 max-h-[85dvh] overflow-y-auto rounded-3xl border-2 border-[#191716] bg-[#FFFDF9] dark:bg-[#201E1C] p-5 shadow-[4px_4px_0px_#191716] sm:inset-x-auto sm:right-5 sm:w-[26rem]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full border border-[#191716] bg-[#E8F7F4] text-xs font-serif font-bold text-[#141817]">
                An
              </span>
              <div>
                <p className="text-[9px] uppercase font-serif tracking-widest text-stone-500 leading-none">
                  Chat with
                </p>
                <h2 className="font-serif text-base font-normal text-foreground">
                  Angie • Ableo Advisor
                </h2>
              </div>
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 hover:bg-secondary text-stone-600 transition-colors"
              aria-label="Close career assistant"
              onClick={() => {
                tts.stop();
                setOpen(false);
              }}
            >
              <X className="size-4" />
            </button>
          </div>

          <ul className="mt-3 space-y-3" aria-live="polite">
            {msgs.map((m) => (
              <li
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-6 rounded-md bg-brand/10 p-3 text-sm"
                    : "rounded-md bg-secondary p-3 text-sm"
                }
              >
                <p className="font-medium text-muted-foreground">
                  {m.role === "user" ? "You" : "Assistant"}
                </p>
                <p className="mt-1">{m.text}</p>
                {m.jobIds?.length ? (
                  <ul className="mt-2 space-y-1">
                    {m.jobIds.map((id) => {
                      const job = findJob(id);
                      return job ? (
                        <li key={id}>
                          <Link
                            to="/jobs/$jobId"
                            params={{ jobId: id }}
                            className="text-sm font-medium text-brand hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            Open {job.title} at {job.company}
                          </Link>
                        </li>
                      ) : null;
                    })}
                  </ul>
                ) : null}
                {m.role === "assistant" && tts.supported ? (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => tts.play(m.text)}>
                      <Volume2 aria-hidden="true" />
                      Read aloud
                    </Button>
                    {tts.state !== "idle" ? (
                      <Button size="sm" variant="outline" onClick={tts.stop}>
                        <Square aria-hidden="true" />
                        Stop
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="assistant-input" className="sr-only">
              Ask the career assistant
            </label>
            <Input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your matches…"
              className="rounded-full border-stone-300 dark:border-stone-700 bg-background px-4 text-xs"
            />
            {voice.supported ? (
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 bg-background text-foreground hover:bg-secondary"
                aria-pressed={voice.listening}
                aria-label={voice.listening ? "Stop voice input" : "Ask by voice"}
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
              >
                <Mic className="size-4" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="submit"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#191716] bg-[#7BD3C2] text-[#141817] shadow-[1px_1px_0px_#141817] hover:bg-[#6ec2b1]"
              aria-label="Send question"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>

          <h3 className="mt-4 text-sm font-semibold">Suggested questions</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <Button variant="outline" size="sm" onClick={() => send(s)}>
                  {s}
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Answers are generated from your profile and the current listings on this device. Nothing
            you share here is sent to employers.
          </p>
        </aside>
      ) : null}
    </>
  );
}
