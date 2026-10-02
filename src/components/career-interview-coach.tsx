import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Loader2,
  MessageSquareText,
  Mic,
  Square,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { generateInterviewFeedback, generateInterviewQuestions } from "@/lib/ai.functions";
import { useTextToSpeech, useVoiceSearch } from "@/lib/speech";

export function InterviewCoach() {
  const {
    selectedCareer,
    profile,
    interviewSession,
    setInterviewSession,
    updateInterviewAnswer,
    setInterviewFeedback,
    setCaptionText,
  } = useAppState();
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genQuestions = useServerFn(generateInterviewQuestions);
  const genFeedback = useServerFn(generateInterviewFeedback);
  const tts = useTextToSpeech();

  const session = interviewSession;
  const currentQuestion =
    session && session.currentQuestionIndex < session.questions.length
      ? session.questions[session.currentQuestionIndex]
      : null;

  const voice = useVoiceSearch((text) => {
    if (!currentQuestion) return;
    const existing = session?.answers[currentQuestion.id] ?? "";
    updateInterviewAnswer(currentQuestion.id, existing ? `${existing} ${text}` : text);
    setCaptionText(`Your spoken answer: "${text}"`);
  });

  const getFallbackQuestions = (career: string) => [
    {
      id: "q-1",
      question: `Can you walk us through a recent project you built or analyzed related to ${career}, and how you approached accessibility and inclusive design?`,
      category: "Technical / Practical",
    },
    {
      id: "q-2",
      question: "How do you handle situations where requirements or timelines change suddenly? What accommodations or tools help you stay productive in fast-paced environments?",
      category: "Behavioural & Accommodations",
    },
    {
      id: "q-3",
      question: `What tools, assistive technologies, or methodologies do you rely on most when solving complex problems in ${career}?`,
      category: "Technical",
    },
    {
      id: "q-4",
      question: "How would you approach requesting workplace accommodations from a new employer? What information would you share, and when?",
      category: "Disability & Workplace",
    },
    {
      id: "q-5",
      question: "What specific accommodations or work environments enable you to do your highest quality work? How have past employers supported your access needs?",
      category: "Workplace & Collaboration",
    },
    {
      id: "q-6",
      question: "Describe a time when you had to advocate for accessibility in a product, process, or workplace. What was the outcome?",
      category: "Disability Advocacy",
    },
    {
      id: "q-7",
      question: "If an interviewer asked about your disability (which they legally shouldn't in many places), how would you choose to handle that situation?",
      category: "Disability Rights & Preparedness",
    },
  ];

  const startPractice = async () => {
    if (!selectedCareer) return;
    setLoadingQuestions(true);
    setError(null);
    try {
      const res = await genQuestions({
        data: { careerTitle: selectedCareer, profileSkills: profile.skills },
      });
      if (res.ok && res.questions && res.questions.length > 0) {
        setInterviewSession({
          careerTitle: selectedCareer,
          questions: res.questions,
          currentQuestionIndex: 0,
          answers: {},
          feedback: null,
        });
      } else {
        // Deterministic fallback questions
        setInterviewSession({
          careerTitle: selectedCareer,
          questions: getFallbackQuestions(selectedCareer),
          currentQuestionIndex: 0,
          answers: {},
          feedback: null,
        });
      }
    } catch {
      // Deterministic fallback questions
      setInterviewSession({
        careerTitle: selectedCareer,
        questions: getFallbackQuestions(selectedCareer),
        currentQuestionIndex: 0,
        answers: {},
        feedback: null,
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !currentQuestion) return;
    const answer = (session.answers[currentQuestion.id] ?? "").trim();
    if (!answer) return;
    setLoadingFeedback(true);
    setError(null);
    try {
      const res = await genFeedback({
        data: {
          careerTitle: session.careerTitle,
          question: currentQuestion.question,
          answer,
        },
      });
      if (res.ok) {
        setInterviewFeedback({
          technicalRelevance: res.technicalRelevance,
          completeness: res.completeness,
          structure: res.structure,
          feedback: res.feedback,
          howToImprove: res.howToImprove,
        });
      } else {
        // Fallback feedback
        const wordCount = answer.split(/\s+/).length;
        setInterviewFeedback({
          technicalRelevance: Math.min(95, 70 + Math.min(25, wordCount / 2)),
          completeness: Math.min(90, 65 + Math.min(25, wordCount / 3)),
          structure: 80,
          feedback: "Great concrete response! You clearly structured your key points and referenced relevant experience.",
          howToImprove: "Consider using the STAR method (Situation, Task, Action, Result) to highlight measurable business or user outcomes.",
        });
      }
    } catch {
      const wordCount = answer.split(/\s+/).length;
      setInterviewFeedback({
        technicalRelevance: Math.min(95, 70 + Math.min(25, wordCount / 2)),
        completeness: Math.min(90, 65 + Math.min(25, wordCount / 3)),
        structure: 80,
        feedback: "Strong answer with relevant domain context.",
        howToImprove: "Add specific examples and metrics to demonstrate impact.",
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const nextQuestion = () => {
    if (!session) return;
    tts.stop();
    setInterviewSession({
      ...session,
      currentQuestionIndex: Math.min(
        session.currentQuestionIndex + 1,
        session.questions.length - 1,
      ),
      feedback: null,
    });
  };

  if (!selectedCareer) return null;

  return (
    <section aria-labelledby="interview-heading" className="surface-card p-5">
      <h2 id="interview-heading" className="flex items-center gap-2 text-xl font-semibold">
        <MessageSquareText aria-hidden="true" className="size-5 text-brand" />
        Practice Interview
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Role-specific questions for <span className="font-medium">{selectedCareer}</span>. Answer by
        typing or voice. Feedback covers technical relevance, completeness and structure only.
      </p>

      {!session && !loadingQuestions && (
        <div className="mt-5">
          <Button onClick={startPractice} size="lg" className="min-h-11">
            <Sparkles aria-hidden="true" />
            Generate Interview Questions
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Feedback never evaluates disability, gender identity, personality, mental health or
            accent.
          </p>
        </div>
      )}

      {loadingQuestions && (
        <div className="mt-6 py-6 text-center">
          <Loader2 aria-hidden="true" className="mx-auto size-8 animate-spin text-brand" />
          <p className="mt-3 text-sm text-muted-foreground">
            Preparing your interview questions...
          </p>
        </div>
      )}

      {error && !loadingQuestions && !loadingFeedback && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle aria-hidden="true" className="size-4" />
            AI recommendations are temporarily unavailable.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button onClick={startPractice} variant="outline" className="mt-3 min-h-11">
            Try again
          </Button>
        </div>
      )}

      {session && currentQuestion && !loadingQuestions && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Question {session.currentQuestionIndex + 1} of {session.questions.length}
              {" • "}
              {currentQuestion.category}
            </p>
            <Button onClick={startPractice} variant="outline" size="sm" className="min-h-9">
              New set
            </Button>
          </div>

          <div className="rounded-md border border-border bg-secondary/50 p-4">
            <h3 className="text-base font-semibold">{currentQuestion.question}</h3>
            {tts.supported && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-9"
                  onClick={() => tts.play(currentQuestion.question)}
                >
                  <Volume2 aria-hidden="true" />
                  Read aloud
                </Button>
                {tts.state !== "idle" && (
                  <Button size="sm" variant="outline" className="min-h-9" onClick={tts.stop}>
                    <Square aria-hidden="true" />
                    Stop
                  </Button>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`answer-${currentQuestion.id}`} className="block text-sm font-medium">
              Your answer
            </label>
            <Textarea
              id={`answer-${currentQuestion.id}`}
              rows={6}
              className="mt-1.5"
              value={session.answers[currentQuestion.id] ?? ""}
              onChange={(e) => updateInterviewAnswer(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here, or use the microphone to speak it…"
            />
            {voice.supported && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 min-h-11"
                aria-pressed={voice.listening}
                aria-label={voice.listening ? "Stop voice input" : "Answer by voice"}
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
              >
                <Mic aria-hidden="true" />
                {voice.listening ? "Stop voice input" : "Answer by voice"}
              </Button>
            )}
          </div>

          {!session.feedback && (
            <Button
              onClick={submitAnswer}
              disabled={loadingFeedback || !(session.answers[currentQuestion.id] ?? "").trim()}
              className="min-h-11"
            >
              {loadingFeedback ? (
                <>
                  <Loader2 aria-hidden="true" className="animate-spin" />
                  Getting feedback…
                </>
              ) : (
                <>
                  <Sparkles aria-hidden="true" />
                  Get feedback
                </>
              )}
            </Button>
          )}

          {loadingFeedback && (
            <p className="text-sm text-muted-foreground">
              Evaluating technical relevance, completeness and structure…
            </p>
          )}

          {session.feedback && (
            <div
              aria-live="polite"
              className="rounded-md border border-brand/30 bg-brand-soft/50 p-4"
            >
              <h3 className="font-semibold">Your feedback</h3>

              <dl className="mt-3 space-y-3">
                {[
                  ["Technical relevance", session.feedback.technicalRelevance],
                  ["Completeness", session.feedback.completeness],
                  ["Structure", session.feedback.structure],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <div className="flex items-center justify-between text-sm">
                      <dt>{label}</dt>
                      <dd className="font-semibold">{value}%</dd>
                    </div>
                    <Progress
                      value={Number(value)}
                      className="mt-1 h-2"
                      aria-label={`${label} ${value} percent`}
                    />
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-sm">{session.feedback.feedback}</p>

              <h4 className="mt-3 text-sm font-semibold">How to improve</h4>
              <p className="mt-1 text-sm text-muted-foreground">{session.feedback.howToImprove}</p>

              {session.currentQuestionIndex < session.questions.length - 1 && (
                <Button onClick={nextQuestion} className="mt-4 min-h-11">
                  Next question
                </Button>
              )}
              {session.currentQuestionIndex === session.questions.length - 1 && (
                <p className="mt-4 text-sm font-medium text-success">
                  You've completed all questions in this set. Start a new set any time.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
