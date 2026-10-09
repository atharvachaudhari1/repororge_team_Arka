import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type WindowWithSpeech = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

/**
 * Normalises spoken utterances by trimming conversational phrases.
 */
export function normaliseSpokenQuery(text: string): string {
  return text
    .replace(/^(search for|find me a job for|find jobs for|show me|jobs for|look for)\s+/i, "")
    .trim();
}

/**
 * Hook for speech recognition in modern browsers with graceful fallback.
 */
export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as WindowWithSpeech;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    setSupported(Boolean(SR));
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as WindowWithSpeech;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;

    try {
      const recognition = new SR();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onend = () => {
        setListening(false);
        recRef.current = null;
      };

      recognition.onerror = () => {
        setListening(false);
        recRef.current = null;
      };

      recRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setListening(false);
    }
  }, [onResult]);

  const stop = useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (err) {
        // ignore
      }
      recRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    supported,
    listening,
    start,
    stop,
  };
}
