import { useState } from "react";
import { Mic, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function VoiceAssistantModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Mic className="size-5 text-brand" />
            Voice Navigation Assistant
          </DialogTitle>
          <DialogDescription>
            Hands-free voice navigation powered by JARVIS is scheduled for implementation in Phase 5.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand mb-3">
            <Sparkles className="size-6 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            Wake word recognition ("Jarvis"), numbered clickable element badges, and voice search will be activated in Phase 5.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
