import { Subtitles, Volume2, X } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";

export function LiveCaptions() {
  const { liveCaptions, setLiveCaptions, captionText, setCaptionText } = useAppState();

  if (!liveCaptions) return null;

  return (
    <div
      role="region"
      aria-label="Real-time Subtitles and Audio Captions"
      className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-2xl -translate-x-1/2 rounded-xl border-2 border-foreground/20 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
          <Subtitles className="size-4 animate-pulse" aria-hidden="true" />
          <span>Ableo Live Subtitles &amp; Captions</span>
        </div>
        <div className="flex items-center gap-1.5">
          {captionText ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setCaptionText("")}
            >
              Clear
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            aria-label="Close live captions"
            onClick={() => setLiveCaptions(false)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-2.5 min-h-12 max-h-32 overflow-y-auto px-1 text-sm font-medium leading-relaxed sm:text-base"
      >
        {captionText ? (
          <p className="text-foreground">{captionText}</p>
        ) : (
          <p className="flex items-center gap-2 italic text-muted-foreground">
            <Volume2 className="size-4" aria-hidden="true" />
            <span>Ready for spoken audio, page reading, or interview practice questions…</span>
          </p>
        )}
      </div>
    </div>
  );
}
