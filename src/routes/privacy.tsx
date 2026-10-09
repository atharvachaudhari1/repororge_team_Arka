import { createFileRoute } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Candidate Privacy &amp; RPwD Legal Rights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zero disability inference. Complete candidate control over medical and accommodation disclosure.
        </p>
      </div>

      <Card className="surface-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand" />
            <CardTitle className="text-base font-bold">Ableo Privacy Commitment</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Our algorithmic guarantees for job seekers with disabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-foreground leading-relaxed">
          <p>
            1. <strong>No Disability Labeling:</strong> We never infer medical diagnoses or disability classifications. We only measure stated accommodations against candidate-chosen preferences.
          </p>
          <p>
            2. <strong>Private by Default:</strong> Legal name, medical records, UDID status, and accommodation requests are masked from employers until you specifically grant permission during an application.
          </p>
          <p>
            3. <strong>Anti-Bias Algorithms:</strong> Match scores are based solely on professional skills and alignment with declared accommodation needs.
          </p>
        </CardContent>
      </Card>

      {/* RPwD Act 2016 Guide */}
      <div id="rights" className="surface-card p-6 rounded-2xl">
        <h2 className="text-lg font-bold font-display mb-3">
          🇮🇳 India RPwD Act 2016 Employer Obligations
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm font-medium">
              Section 21: Equal Opportunity Policy
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              Every private and public establishment with 20 or more employees must formulate and display an Equal Opportunity Policy detailing accommodations provided.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-sm font-medium">
              Section 3: Protection from Discrimination
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground">
              No person with disability shall be discriminated against in any matter relating to employment, promotion, or training.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
