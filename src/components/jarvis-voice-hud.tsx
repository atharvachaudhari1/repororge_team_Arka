import { useAppState } from "@/lib/app-state";
import { Mic, Radio } from "lucide-react";

export function JarvisVoiceHud() {
  const { voiceNavConfig } = useAppState();

  if (!voiceNavConfig?.enabled) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-full border border-brand/50 bg-card/95 px-4 py-2.5 shadow-xl backdrop-blur-sm"
    >
      <div className="flex size-7 items-center justify-center rounded-full bg-brand/20 text-brand animate-pulse">
        <Mic className="size-4" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Radio className="size-3 text-brand animate-pulse" />
          JARVIS Voice Control (Phase 5 Active)
        </span>
        <span className="text-[11px] text-muted-foreground">
          Say "Jarvis, help" or click mic
        </span>
      </div>
    </div>
  );
}
