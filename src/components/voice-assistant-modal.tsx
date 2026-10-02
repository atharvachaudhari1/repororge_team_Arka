import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Volume2, X, Command, Sparkles } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { useTextToSpeech, useVoiceSearch } from "@/lib/speech";
import { toast } from "sonner";

export function VoiceAssistantModal() {
  const {
    voiceAssistantOpen,
    setVoiceAssistantOpen,
    highContrast,
    setHighContrast,
    dyslexiaFont,
    setDyslexiaFont,
    liveCaptions,
    setLiveCaptions,
    setCaptionText,
    readingRuler,
    setReadingRuler,
  } = useAppState();

  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("Listening for voice command…");
  const navigate = useNavigate();
  const tts = useTextToSpeech();

  const handleVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    setTranscript(rawText);
    setCaptionText(`Voice Command: "${rawText}"`);

    if (text.includes("job") || text.includes("search") || text.includes("open jobs")) {
      setFeedback("Navigating to Job Search…");
      tts.play("Opening Jobs");
      navigate({ to: "/jobs", search: { q: "" } });
      setVoiceAssistantOpen(false);
      return;
    }

    if (text.includes("dashboard")) {
      setFeedback("Navigating to Dashboard…");
      tts.play("Opening Dashboard");
      navigate({ to: "/dashboard" });
      setVoiceAssistantOpen(false);
      return;
    }

    if (text.includes("profile")) {
      setFeedback("Navigating to Profile…");
      tts.play("Opening Profile");
      navigate({ to: "/profile" });
      setVoiceAssistantOpen(false);
      return;
    }

    if (text.includes("application")) {
      setFeedback("Navigating to My Applications…");
      tts.play("Opening Applications");
      navigate({ to: "/applications" });
      setVoiceAssistantOpen(false);
      return;
    }

    if (text.includes("resume") || text.includes("match")) {
      setFeedback("Opening Resume Match…");
      tts.play("Opening Resume Match");
      navigate({ to: "/resume-match" });
      setVoiceAssistantOpen(false);
      return;
    }

    if (text.includes("career") || text.includes("gps") || text.includes("path")) {
      setFeedback("Opening Career GPS…");
      tts.play("Opening Career GPS");
      navigate({ to: "/career-gps" });
      setVoiceAssistantOpen(false);
      return;
    }

    if (text.includes("contrast")) {
      const nextVal = !highContrast;
      setHighContrast(nextVal);
      const msg = nextVal ? "High contrast enabled" : "High contrast disabled";
      setFeedback(msg);
      tts.play(msg);
      toast.success(msg);
      return;
    }

    if (text.includes("caption") || text.includes("subtitle")) {
      const nextVal = !liveCaptions;
      setLiveCaptions(nextVal);
      const msg = nextVal ? "Live captions enabled" : "Live captions disabled";
      setFeedback(msg);
      tts.play(msg);
      toast.success(msg);
      return;
    }

    if (text.includes("dyslexia") || text.includes("font")) {
      const nextVal = !dyslexiaFont;
      setDyslexiaFont(nextVal);
      const msg = nextVal ? "Dyslexia-friendly font enabled" : "Dyslexia font disabled";
      setFeedback(msg);
      tts.play(msg);
      toast.success(msg);
      return;
    }

    if (text.includes("ruler") || text.includes("guide") || text.includes("mask")) {
      const nextVal = !readingRuler;
      setReadingRuler(nextVal);
      const msg = nextVal ? "Reading ruler enabled" : "Reading ruler disabled";
      setFeedback(msg);
      tts.play(msg);
      toast.success(msg);
      return;
    }

    if (text.includes("read") || text.includes("aloud") || text.includes("speak")) {
      const main = document.getElementById("main");
      const pageText = (main?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 3000);
      if (pageText) {
        setFeedback("Reading main content aloud…");
        setCaptionText(pageText.slice(0, 200));
        tts.play(pageText);
        setVoiceAssistantOpen(false);
      }
      return;
    }

    setFeedback(`Heard: "${rawText}". Try saying "Find jobs", "Dashboard", "Profile", or "High contrast".`);
  };

  const voice = useVoiceSearch(handleVoiceCommand);

  useEffect(() => {
    if (voiceAssistantOpen && voice.supported && !voice.listening) {
      voice.start();
    }
  }, [voiceAssistantOpen, voice.supported]);

  if (!voiceAssistantOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="surface-card w-full max-w-md border-2 border-brand/40 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Mic className="size-4" aria-hidden="true" />
            </span>
            <h2 id="voice-modal-title" className="text-lg font-bold">
              Ableo Voice Assistant
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            onClick={() => {
              voice.stop();
              setVoiceAssistantOpen(false);
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="my-6 text-center">
          <div
            className={`mx-auto flex size-20 items-center justify-center rounded-full transition-transform ${
              voice.listening ? "animate-pulse bg-brand text-brand-foreground shadow-lg shadow-brand/40" : "bg-muted text-muted-foreground"
            }`}
          >
            {voice.listening ? <Mic className="size-9" /> : <MicOff className="size-9" />}
          </div>
          <p className="mt-4 font-semibold text-foreground" aria-live="polite">
            {feedback}
          </p>
          {transcript ? (
            <p className="mt-1 text-sm text-brand font-medium italic">"{transcript}"</p>
          ) : null}
        </div>

        <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
            <Command className="size-3.5" />
            Supported Spoken Commands:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <span>• "Find jobs"</span>
            <span>• "Open dashboard"</span>
            <span>• "View profile"</span>
            <span>• "My applications"</span>
            <span>• "Toggle contrast"</span>
            <span>• "Live captions"</span>
            <span>• "Dyslexia font"</span>
            <span>• "Read page aloud"</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {voice.listening ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={voice.stop}
            >
              <MicOff className="size-4 mr-1.5" />
              Pause Listening
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              className="flex-1"
              onClick={voice.start}
            >
              <Mic className="size-4 mr-1.5" />
              Start Listening
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              voice.stop();
              setVoiceAssistantOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
