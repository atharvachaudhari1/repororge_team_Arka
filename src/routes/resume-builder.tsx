import { createFileRoute } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/resume-builder")({
  component: ResumeBuilderPage,
});

function ResumeBuilderPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div className="surface-card p-8 rounded-3xl text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand/20 text-brand mb-2">
          <FileText className="size-6" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">
          Accessible Resume Studio
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          ATS-compliant accessible resume builder and clean semantic HTML/PDF exporter (Phase 7).
        </p>
      </div>
    </div>
  );
}
