/**
 * JARVIS Audio & Speech Synthesis Engine
 * Provides spoken speech responses and synthesized futuristic audio cues using Web Audio API.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      // AudioContext may be restricted until first gesture/click
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes futuristic JARVIS audio cues using Oscillator nodes.
 */
export function playJarvisChime(type: "wake" | "confirm" | "sleep" | "error"): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (type === "wake") {
    // Two rising bright harmonic tones (Chime: Low -> High)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(440, now); // A4
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    osc2.frequency.setValueAtTime(554.37, now); // C#5
    osc2.frequency.exponentialRampToValueAtTime(1108.73, now + 0.14);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  } else if (type === "confirm") {
    // Crisp positive confirmation beep
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(784, now); // G5
    osc.frequency.setValueAtTime(1046.5, now + 0.06); // C6

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === "sleep") {
    // Gentle descending tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.2); // E4

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.24);
  } else if (type === "error") {
    // Soft low double buzz
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

/**
 * Speaks text using window.speechSynthesis in JARVIS tone.
 */
export function speakJarvis(
  text: string,
  options: { rate?: number; lang?: string; onEnd?: () => void } = {},
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1.05;
    utterance.lang = options.lang ?? "en-IN";
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith("en-IN") || v.name.includes("India")) ||
      voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google")),
      ) ||
      voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
}

/**
 * Stops any current speech synthesis.
 */
export function stopJarvis(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
