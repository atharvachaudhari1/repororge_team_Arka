import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop?: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type WindowWithSpeech = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

/** Simple wrapper over the Web Speech API with graceful fallback. */
export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as unknown as WindowWithSpeech) : null;
    const SR = win?.SpeechRecognition || win?.webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  const start = useCallback(() => {
    const win = typeof window !== "undefined" ? (window as unknown as WindowWithSpeech) : null;
    const SR = win?.SpeechRecognition || win?.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: { results: ArrayLike<ArrayLike<{ transcript?: string }>> }) =>
      onResult(String(e.results[0]?.[0]?.transcript || ""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop?.();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}

/** Strips filler words from a spoken query like "Find remote developer jobs in Chennai". */
export function normaliseSpokenQuery(text: string) {
  return text
    .toLowerCase()
    .replace(
      /\b(find|search|show|me|please|for|the|a|an|jobs?|job|openings?|vacancy|vacancies|in|at|near)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export type SpeechState = "idle" | "speaking" | "paused";

export function useTextToSpeech() {
  const [state, setState] = useState<SpeechState>("idle");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const play = useCallback(
    (text: string, rate = 1) => {
      if (!("speechSynthesis" in window)) return;
      if (state === "paused") {
        window.speechSynthesis.resume();
        setState("speaking");
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      u.rate = Math.max(0.5, Math.min(2, rate));
      u.onend = () => setState("idle");
      window.speechSynthesis.speak(u);
      setState("speaking");
    },
    [state],
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  return { supported, state, play, pause, stop };
}
