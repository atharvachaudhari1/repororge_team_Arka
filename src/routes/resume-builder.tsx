import { createFileRoute } from "@tanstack/react-router";
import { ResumeBuilder } from "@/components/resume-builder";

export const Route = createFileRoute("/resume-builder")({
  head: () => ({
    meta: [
      { title: "Resume Builder — Ableo" },
      {
        name: "description",
        content:
          "Build an ATS-friendly resume by uploading an existing file or answering guided questions.",
      },
    ],
  }),
  component: ResumeBuilder,
});
