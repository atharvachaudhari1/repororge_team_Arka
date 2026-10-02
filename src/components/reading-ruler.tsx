import { useEffect, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { Button } from "@/components/ui/button";

export function ReadingRuler() {
  const { readingRuler, setReadingRuler, readingRulerHeight, setReadingRulerHeight } = useAppState();
  const [mouseY, setMouseY] = useState(250);

  useEffect(() => {
    if (!readingRuler) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReadingRuler(false);
      } else if (e.key === "ArrowUp" && e.altKey) {
        setMouseY((y) => Math.max(50, y - 20));
      } else if (e.key === "ArrowDown" && e.altKey) {
        setMouseY((y) => Math.min(window.innerHeight - 50, y + 20));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [readingRuler, setReadingRuler]);

  if (!readingRuler) return null;

  const topHeight = Math.max(0, mouseY - readingRulerHeight / 2);
  const bottomTop = mouseY + readingRulerHeight / 2;

  return (
    <>
      {/* Top overlay */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-black/40 backdrop-blur-[0.5px] transition-all duration-75"
        style={{ height: `${topHeight}px` }}
        aria-hidden="true"
      />

      {/* Focus guide window */}
      <div
        className="pointer-events-none fixed inset-x-0 z-40 border-y-2 border-brand/60 bg-brand/5 shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all duration-75"
        style={{
          top: `${topHeight}px`,
          height: `${readingRulerHeight}px`,
        }}
        aria-hidden="true"
      >
        {/* Subtle reading guideline in middle */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-dashed border-brand/30" />
      </div>

      {/* Bottom overlay */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-black/40 backdrop-blur-[0.5px] transition-all duration-75"
        style={{ top: `${bottomTop}px` }}
        aria-hidden="true"
      />

      {/* Floating Ruler Controls (Interactive) */}
      <aside
        aria-label="Reading ruler controls"
        className="fixed bottom-20 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-1.5 shadow-xl backdrop-blur-md"
      >
        <span className="text-xs font-semibold text-brand">Ruler</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="size-7 p-0"
          aria-label="Decrease ruler height"
          onClick={() => setReadingRulerHeight(Math.max(30, readingRulerHeight - 15))}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="text-xs font-mono text-muted-foreground">{readingRulerHeight}px</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="size-7 p-0"
          aria-label="Increase ruler height"
          onClick={() => setReadingRulerHeight(Math.min(180, readingRulerHeight + 15))}
        >
          <Plus className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="size-7 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Close reading ruler"
          onClick={() => setReadingRuler(false)}
        >
          <X className="size-3.5" />
        </Button>
      </aside>
    </>
  );
}
