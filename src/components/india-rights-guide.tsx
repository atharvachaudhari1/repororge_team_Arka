import { ExternalLink, ShieldAlert, Award, FileText, Scale } from "lucide-react";

export function IndiaRightsGuide() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Legal Disclaimer</h4>
            <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              This guide provides general informational guidance on disability rights and policies
              in India. It does not constitute formal legal advice. For binding interpretations or
              grievances, consult a qualified advocate or the Office of the Chief Commissioner for
              Persons with Disabilities (CCPD).
            </p>
          </div>
        </div>
      </div>

      {/* RPwD Act 2016 Sections */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-brand" />
          <h3 className="text-lg font-semibold text-foreground">
            Rights of Persons with Disabilities (RPwD) Act, 2016
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enacted to fulfill India&apos;s obligations under the United Nations Convention on the
          Rights of Persons with Disabilities (UNCRPD), the RPwD Act 2016 replaced the 1995 Act,
          expanding recognized conditions from 7 to 21 disabilities and guaranteeing critical
          employment protections.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3.5 bg-card/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-mono text-brand">
                Section 20
              </span>
              Non-Discrimination in Employment
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Mandates that no government establishment shall discriminate against any person with
              disability in any matter relating to employment. Also bars promotion denial solely on
              grounds of disability.
            </p>
          </div>

          <div className="rounded-lg border border-border p-3.5 bg-card/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-mono text-brand">
                Section 21
              </span>
              Equal Opportunity Policy
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Requires every establishment (both public and private) to formulate and notify an
              Equal Opportunity Policy detailing facilities and amenities provided to persons with
              disabilities.
            </p>
          </div>

          <div className="rounded-lg border border-border p-3.5 bg-card/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-mono text-brand">
                Section 2(y)
              </span>
              Reasonable Accommodation
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Legally guarantees necessary and appropriate modifications and adjustments, without
              imposing a disproportionate or undue burden, ensuring candidates and employees enjoy
              rights on an equal basis.
            </p>
          </div>

          <div className="rounded-lg border border-border p-3.5 bg-card/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-mono text-brand">
                Section 34
              </span>
              Reservations for Benchmark Disabilities
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Provides at least 4% reservation in identified posts in government establishments for
              persons with benchmark disabilities (minimum 40% certified disability).
            </p>
          </div>
        </div>
      </div>

      {/* UDID Swavlamban Card Information */}
      <div className="rounded-lg border border-border p-4 bg-secondary/30 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-brand" />
          <h4 className="text-sm font-semibold text-foreground">
            Unique Disability ID (UDID) — Swavlamban Card
          </h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The Department of Empowerment of Persons with Disabilities (DEPwD), Ministry of Social
          Justice and Empowerment, issues the UDID card to create a national database for PwD. It
          serves as a single verification document for identification, government schemes, and
          workplace accommodation entitlements, eliminating the need to produce multiple hospital
          certificates.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href="https://www.swavlambancard.gov.in"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="size-3.5 text-brand" />
            Apply or Verify UDID (Swavlamban Portal)
            <ExternalLink className="size-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Key National Support Organizations */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">
          National Advocacy & Financing Bodies
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://ncpedp.org"
            target="_blank"
            rel="noreferrer noopener"
            className="flex flex-col justify-between rounded-lg border border-border p-3.5 hover:border-brand/40 hover:bg-muted/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">NCPEDP</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                National Centre for Promotion of Employment for Disabled People — India&apos;s
                premier cross-disability advocacy body bridging industry, government, and civil
                society for inclusive employment.
              </p>
            </div>
            <span className="mt-2 text-[11px] font-mono text-brand">ncpedp.org</span>
          </a>

          <a
            href="https://nhfdc.nic.in"
            target="_blank"
            rel="noreferrer noopener"
            className="flex flex-col justify-between rounded-lg border border-border p-3.5 hover:border-brand/40 hover:bg-muted/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">NHFDC</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                National Handicapped Finance and Development Corporation — apex institution under
                MSJE offering concessional loans and skill-training programs for entrepreneurs and
                job seekers with disabilities.
              </p>
            </div>
            <span className="mt-2 text-[11px] font-mono text-brand">nhfdc.nic.in</span>
          </a>
        </div>
      </div>
    </div>
  );
}
