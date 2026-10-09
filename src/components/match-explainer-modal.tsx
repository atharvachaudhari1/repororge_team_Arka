import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Volume2,
  Mic,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MatchResult } from "@/lib/matching";
import { useAppState } from "@/lib/app-state";
import { explainJobMatch } from "@/lib/ai.functions";
import { useTextToSpeech, useVoiceSearch } from "@/lib/speech";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchResult;
  accessibilityFitScore?: number;
}

export function MatchExplainerModal({ open, onOpenChange, match, accessibilityFitScore }: Props) {
  const { profile, ttsRate, setCaptionText } = useAppState();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    {
      q: string;
      answer: string;
      tips: string[];
      accommodation: string;
    }[]
  >([]);

  const tts = useTextToSpeech();
  const explainFn = useServerFn(explainJobMatch);

  const voice = useVoiceSearch((text) => {
    setQuestion(text);
    setCaptionText(`Question: "${text}"`);
    handleAsk(text);
  });

  const handleAsk = async (userPrompt?: string) => {
    const q = (userPrompt ?? question).trim();
    setLoading(true);
    try {
      const res = await explainFn({
        data: {
          jobTitle: match.job.title,
          company: match.job.company,
          matchScore: match.total,
          matchedSkills: match.matchedRequired,
          missingSkills: match.missingRequired,
          workPreference: profile.workPreference,
          jobWorkMode: match.job.workMode,
          accessibilityFitScore,
          userQuestion: q || undefined,
        },
      });

      if (res.ok) {
        setHistory((prev) => [
          ...prev,
          {
            q: q || `Explain my ${match.total}% Match Score`,
            answer: res.answer,
            tips: res.improvementTips,
            accommodation: res.accommodationAdvice,
          },
        ]);
        setQuestion("");
      }
    } finally {
      setLoading(false);
    }
  };

  const readAloud = (text: string) => {
    setCaptionText(text.slice(0, 200));
    tts.play(text, ttsRate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="size-5 text-brand" />
              Explainable AI Match Breakdown
            </DialogTitle>
            <Badge className="bg-brand text-brand-foreground px-2.5 py-1 text-sm font-bold">
              {match.total}% Match
            </Badge>
          </div>
          <DialogDescription>
            {match.job.title} at <strong>{match.job.company}</strong> ({match.job.workMode})
          </DialogDescription>
        </DialogHeader>

        {/* Match Dimensions Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground block">Skills</span>
            <span className="text-base font-bold text-foreground">{match.skills}%</span>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground block">Experience</span>
            <span className="text-base font-bold text-foreground">{match.experience}%</span>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground block">Career Goal</span>
            <span className="text-base font-bold text-foreground">{match.career}%</span>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-2.5 text-center">
            <span className="text-[11px] text-muted-foreground block">Work Setup</span>
            <span className="text-base font-bold text-foreground">{match.workPreference}%</span>
          </div>
        </div>

        {/* Quick Question Pills */}
        <div className="space-y-1.5 pt-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="size-3.5 text-brand" />
            Quick Explanation Prompts:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              `Why did I score ${match.total}%?`,
              `How can I improve my score to 95%?`,
              `What accommodations should I request?`,
              `Analyze my skill gaps for this job`,
            ].map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-full"
                disabled={loading}
                onClick={() => handleAsk(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversation Feed */}
        <div className="space-y-4 pt-2">
          {history.length === 0 && !loading && (
            <div className="rounded-xl border border-brand/20 bg-brand-soft/20 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-brand">
                  <ShieldCheck className="size-4" />
                  Transparent AI Evaluation
                </span>
                {tts.supported && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() =>
                      readAloud(
                        `You match ${match.requirementsMet} of ${match.requirementsTotal} requirements. Strongest: ${match.strongest.join(", ")}.`,
                      )
                    }
                  >
                    <Volume2 className="size-3.5" />
                    Read
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                You match <strong>{match.requirementsMet}</strong> of{" "}
                <strong>{match.requirementsTotal}</strong> listed requirements. Your strongest
                skills are {match.strongest.join(", ") || "established experience"}.
                {match.missingRequired.length > 0 &&
                  ` A minor gap is ${match.missingRequired[0]}, which you can highlight projects for.`}
              </p>
            </div>
          )}

          {history.map((item, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="font-semibold text-xs text-brand uppercase tracking-wide">
                  Q: {item.q}
                </span>
                {tts.supported && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => readAloud(item.answer)}
                  >
                    <Volume2 className="size-3.5" />
                    Listen
                  </Button>
                )}
              </div>
              <p className="text-foreground leading-relaxed text-xs sm:text-sm">{item.answer}</p>

              {item.tips && item.tips.length > 0 && (
                <div className="rounded-lg bg-background p-3 border border-border/60">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                    <TrendingUp className="size-3.5 text-success" />
                    Actionable Improvement Recommendations:
                  </span>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
                    {item.tips.map((tip, tIdx) => (
                      <li key={tIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {item.accommodation && (
                <div className="rounded-lg bg-brand-soft/40 p-3 border border-brand/20 text-xs">
                  <span className="font-semibold text-brand block mb-1 flex items-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    Accommodation &amp; Inclusion Guidance:
                  </span>
                  <p className="text-muted-foreground">{item.accommodation}</p>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-brand">
              <Loader2 className="size-5 animate-spin" />
              <span>Analyzing job criteria and candidate profile…</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 pt-2"
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask AI: e.g. Why was my experience scored 80%?"
            className="text-xs sm:text-sm"
            disabled={loading}
          />
          {voice.supported && (
            <Button
              type="button"
              variant={voice.listening ? "default" : "outline"}
              size="icon"
              className="shrink-0"
              onClick={voice.listening ? voice.stop : voice.start}
              aria-label={voice.listening ? "Stop voice listening" : "Ask by voice"}
            >
              <Mic
                className={`size-4 ${voice.listening ? "animate-pulse text-destructive" : ""}`}
              />
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            disabled={loading || !question.trim()}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
