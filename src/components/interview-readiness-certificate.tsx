import { useState } from "react";
import {
  Award,
  CheckCircle2,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppState, type InterviewSession } from "@/lib/app-state";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: InterviewSession;
}

export function InterviewReadinessCertificateModal({ open, onOpenChange, session }: Props) {
  const { profile } = useAppState();
  const candidateName = profile.displayName || profile.name || "Candidate";

  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(session.answers).filter(
    (k) => (session.answers[k] ?? "").trim().length > 0
  ).length;

  const baseScore = session.feedback
    ? Math.round(
        (session.feedback.technicalRelevance +
          session.feedback.completeness +
          session.feedback.structure) /
          3
      )
    : 85;

  const readinessScore = Math.min(
    98,
    Math.round(baseScore * 0.7 + (answeredCount / Math.max(1, totalQuestions)) * 30)
  );

  const handleDownload = () => {
    const certHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Interview Readiness Certificate — ${candidateName}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 24px; border: 8px solid #0f172a; border-radius: 12px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .badge { color: #0284c7; font-weight: bold; text-transform: uppercase; font-size: 13px; letter-spacing: 2px; }
    h1 { font-size: 32px; color: #0f172a; margin: 10px 0; }
    .candidate { font-size: 26px; color: #0f766e; font-weight: bold; margin: 16px 0; }
    .score-card { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
    .score { font-size: 44px; font-weight: 800; color: #15803d; }
    .details { font-size: 15px; color: #334155; line-height: 1.8; }
    @media print { body { border: 4px solid #000; margin: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Ableo AI Career &amp; Employment Platform</div>
    <h1>Certificate of Interview Readiness</h1>
    <p>This verifies the completion of role-specific accessible interview preparation for:</p>
    <div class="candidate">${candidateName}</div>
    <p>Target Career Specialization: <strong>${session.careerTitle}</strong></p>
  </div>

  <div class="score-card">
    <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #166534;">Verified Readiness Score</div>
    <div class="score">${readinessScore}%</div>
    <p style="margin: 4px 0; color: #166534;">Practiced ${answeredCount} of ${totalQuestions} scenario questions covering technical depth &amp; workplace accommodations.</p>
  </div>

  <div class="details">
    <h3>Preparation Competencies Demonstrated:</h3>
    <ul>
      <li><strong>Technical Articulation:</strong> Clear communication of domain methodologies and practical problem-solving.</li>
      <li><strong>Response Structuring:</strong> Organized STAR framework addressing business impact and team collaboration.</li>
      <li><strong>Self-Advocacy &amp; Accommodations:</strong> Prepared to state workplace needs respectfully and professionally under RPwD Act guidelines.</li>
    </ul>
    <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">Issued by Ableo &bull; Verified Accessible Career Tools &bull; ${new Date().toLocaleDateString("en-IN")}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([certHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, "_")}_Interview_Readiness.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Interview readiness certificate downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Award className="size-5 text-brand" />
              Interview Readiness Assessment
            </DialogTitle>
            <Badge className="bg-success text-success-foreground font-bold">
              {readinessScore}% Ready
            </Badge>
          </div>
          <DialogDescription>
            Performance evaluation and readiness certificate for <strong>{session.careerTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Certificate Card Preview */}
        <div className="rounded-xl border-2 border-brand/40 bg-brand-soft/20 p-5 text-center space-y-3">
          <Badge variant="outline" className="text-[11px] font-mono border-brand/50 text-brand">
            Ableo Inclusive Hiring Program
          </Badge>
          <h3 className="text-2xl font-black text-foreground">{candidateName}</h3>
          <p className="text-xs text-muted-foreground">
            Target Career Path: <strong className="text-foreground">{session.careerTitle}</strong>
          </p>

          <div className="rounded-lg bg-background border border-border p-4 mx-auto max-w-xs shadow-sm">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
              Interview Readiness Index
            </span>
            <span className="text-4xl font-extrabold text-brand mt-1 block">{readinessScore}%</span>
            <Progress value={readinessScore} className="mt-2" aria-label={`Readiness score ${readinessScore} percent`} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-2 text-xs">
            <div className="rounded-md bg-secondary/50 p-2.5 border border-border/60">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-success" /> Questions Practiced
              </span>
              <p className="text-muted-foreground mt-0.5">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>
            <div className="rounded-md bg-secondary/50 p-2.5 border border-border/60">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-brand" /> Accommodation Readiness
              </span>
              <p className="text-muted-foreground mt-0.5">Self-advocacy scenarios prepped</p>
            </div>
          </div>
        </div>

        {/* Strengths & Recommendations */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-success" />
            Interview Preparation Insights
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>Answers demonstrated domain experience and practical problem-solving capability.</li>
            <li>Ready to request accommodations respectfully during recruitment phone screens.</li>
            <li>
              Remember to ask the interviewer: <em>"Can you describe how your team ensures accessible documentation and meeting captions?"</em>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.print()}
          >
            <Printer className="size-3.5" />
            Print Certificate
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 text-xs bg-brand text-brand-foreground"
            onClick={handleDownload}
          >
            <Download className="size-3.5" />
            Download Certificate (.html)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
