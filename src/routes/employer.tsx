import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCESS_FEATURES,
  INCLUSION_FEATURES,
  type AccessFeature,
  type Employment,
  type ExperienceBand,
  type InclusionFeature,
  type Job,
  type WorkMode,
} from "@/lib/jobs-data";
import { APPLICATION_STATUSES, useAppState, type ApplicationStatus } from "@/lib/app-state";
import { InclusionIntelligence } from "@/components/inclusion-intelligence";
import { CandidateTalentMap } from "@/components/candidate-talent-map";
import { PortalGate } from "@/components/portal-gate";

export const Route = createFileRoute("/employer")({
  head: () => ({
    meta: [
      { title: "Employer Portal — AccessPath" },
      {
        name: "description",
        content:
          "Post a role on AccessPath and state exactly which accessibility and inclusion support your workplace offers.",
      },
      { property: "og:title", content: "Employer Portal — AccessPath" },
      {
        property: "og:description",
        content: "Post inclusive roles with transparent accessibility information.",
      },
    ],
  }),
  component: () => (
    <PortalGate role="employer">
      <EmployerPage />
    </PortalGate>
  ),
});

const EMPTY = {
  title: "",
  company: "",
  city: "",
  salary: "",
  about: "",
  skills: "",
  workMode: "Remote" as WorkMode,
  employment: "Full-time" as Employment,
  experience: "Fresher" as ExperienceBand,
};

function EmployerPage() {
  const {
    employerJobs,
    addEmployerJob,
    updateEmployerJob,
    applications,
    findJob,
    setApplicationStatus,
    setInterviewMeetingLink,
    profile,
  } = useAppState();
  const [form, setForm] = useState(EMPTY);
  const [access, setAccess] = useState<AccessFeature[]>([]);
  const [inclusion, setInclusion] = useState<InclusionFeature[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicantSearch, setApplicantSearch] = useState("");

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const myJobIds = new Set(employerJobs.map((j) => j.id));
  const applicants = applications.filter((a) => myJobIds.has(a.jobId));
  const normalizedApplicantSearch = applicantSearch.trim().toLowerCase();
  const filteredApplicants = applicants.filter((a) => {
    if (!normalizedApplicantSearch) return true;
    const job = findJob(a.jobId);
    return [profile.name, profile.skills.join(" "), job?.title, job?.company, a.status]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedApplicantSearch));
  });

  const startEditing = (job: Job) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      city: job.city === "Remote (India)" ? "" : job.city,
      salary: job.salary ?? "",
      about: job.about,
      skills: job.requiredSkills.join(", "),
      workMode: job.workMode,
      employment: job.employment,
      experience: job.experience,
    });
    setAccess(job.access);
    setInclusion(job.inclusion);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetJobForm = () => {
    setForm(EMPTY);
    setAccess([]);
    setInclusion([]);
    setEditingJobId(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Employer portal</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Post a role and state the accessibility and inclusion support your workplace actually
        provides. AccessPath publishes exactly what you select and never labels an employer
        "inclusive" on its own.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="post-heading">
          <h2 id="post-heading" className="text-2xl font-bold">
            {editingJobId ? "Edit job post" : "Post a job"}
          </h2>
          <form
            className="mt-4 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (access.length === 0) {
                toast.error("Select the accessibility support available for this role.");
                return;
              }
              const skills = form.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const job: Job = {
                id: editingJobId ?? `emp-${Date.now()}`,
                title: form.title,
                company: form.company,
                city: form.workMode === "Remote" ? "Remote (India)" : form.city,
                workMode: form.workMode,
                employment: form.employment,
                experience: form.experience,
                category: "Operations",
                salary: form.salary || undefined,
                posted: editingJobId
                  ? (employerJobs.find((existing) => existing.id === editingJobId)?.posted ??
                    "Today")
                  : "Today",
                about: form.about,
                responsibilities: [],
                requiredSkills: skills,
                preferredSkills: [],
                access,
                inclusion,
                accessSource: "Provided by employer",
              };
              if (editingJobId) {
                updateEmployerJob(job);
                toast.success("Job post updated");
              } else {
                addEmployerJob(job);
                toast.success("Job posted and live on AccessPath");
              }
              resetJobForm();
            }}
          >
            <div className="surface-card space-y-4 p-5">
              {[
                { id: "e-title", label: "Job title", key: "title" as const, required: true },
                { id: "e-company", label: "Company name", key: "company" as const, required: true },
                { id: "e-city", label: "Location (city)", key: "city" as const, required: false },
                { id: "e-salary", label: "Salary range", key: "salary" as const, required: false },
              ].map((f) => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="block text-sm font-medium">
                    {f.label}
                    {f.required ? " *" : ""}
                  </label>
                  <Input
                    id={f.id}
                    className="mt-1.5"
                    required={f.required}
                    value={form[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div>
                <label htmlFor="e-about" className="block text-sm font-medium">
                  Description *
                </label>
                <Textarea
                  id="e-about"
                  rows={4}
                  required
                  className="mt-1.5"
                  value={form.about}
                  onChange={(e) => set("about", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="e-skills" className="block text-sm font-medium">
                  Skills *
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">Separate skills with commas</p>
                <Input
                  id="e-skills"
                  required
                  className="mt-1.5"
                  value={form.skills}
                  onChange={(e) => set("skills", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="e-mode" className="block text-sm font-medium">
                    Work mode
                  </label>
                  <Select
                    value={form.workMode}
                    onValueChange={(v) => set("workMode", v as WorkMode)}
                  >
                    <SelectTrigger id="e-mode" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Remote", "Hybrid", "On-site"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="e-type" className="block text-sm font-medium">
                    Employment type
                  </label>
                  <Select
                    value={form.employment}
                    onValueChange={(v) => set("employment", v as Employment)}
                  >
                    <SelectTrigger id="e-type" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Full-time", "Part-time", "Internship", "Contract"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="e-exp" className="block text-sm font-medium">
                    Experience
                  </label>
                  <Select
                    value={form.experience}
                    onValueChange={(v) => set("experience", v as ExperienceBand)}
                  >
                    <SelectTrigger id="e-exp" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Fresher", "0-2 years", "2-5 years", "5+ years"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="surface-card space-y-4 p-5">
              <h3 className="text-lg font-semibold">Accessibility support available *</h3>
              <p className="text-sm text-muted-foreground">
                Select only what your organisation genuinely provides. This appears verbatim on the
                listing so candidates can decide for themselves.
              </p>
              <fieldset>
                <legend className="text-sm font-medium">Accessibility</legend>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(Object.entries(ACCESS_FEATURES) as [AccessFeature, string][]).map(
                    ([k, label]) => (
                      <li key={k} className="flex items-center gap-2">
                        <Checkbox
                          id={`acs-${k}`}
                          checked={access.includes(k)}
                          onCheckedChange={() =>
                            setAccess((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))
                          }
                        />
                        <label htmlFor={`acs-${k}`} className="text-sm">
                          {label}
                        </label>
                      </li>
                    ),
                  )}
                </ul>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium">
                  Gender-inclusive workplace information
                </legend>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(Object.entries(INCLUSION_FEATURES) as [InclusionFeature, string][]).map(
                    ([k, label]) => (
                      <li key={k} className="flex items-center gap-2">
                        <Checkbox
                          id={`inc-${k}`}
                          checked={inclusion.includes(k)}
                          onCheckedChange={() =>
                            setInclusion((p) =>
                              p.includes(k) ? p.filter((x) => x !== k) : [...p, k],
                            )
                          }
                        />
                        <label htmlFor={`inc-${k}`} className="text-sm">
                          {label}
                        </label>
                      </li>
                    ),
                  )}
                </ul>
              </fieldset>
            </div>

            <Button type="submit" size="lg">
              {editingJobId ? "Save changes" : "Post job"}
            </Button>
            {editingJobId ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="ml-2"
                onClick={resetJobForm}
              >
                Cancel
              </Button>
            ) : null}
          </form>
        </section>

        <div className="space-y-8">
          <section aria-labelledby="posted-heading">
            <h2 id="posted-heading" className="text-2xl font-bold">
              Your posted jobs
            </h2>
            {employerJobs.length === 0 ? (
              <p className="surface-card mt-4 p-5 text-sm text-muted-foreground">
                No jobs posted yet. Posted roles appear in candidate search immediately.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {employerJobs.map((j) => (
                  <li key={j.id} className="surface-card p-4">
                    <h3 className="font-semibold">{j.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {j.company} • {j.city} • {j.workMode} • {j.experience}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => startEditing(j)}
                    >
                      Edit job post
                    </Button>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {j.access.map((a) => (
                        <li key={a}>
                          <Badge variant="secondary" className="font-normal">
                            {ACCESS_FEATURES[a]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="applicants-heading">
            <h2 id="applicants-heading" className="text-2xl font-bold">
              Applicants
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You see job-related information only. Disability and gender identity are never sent to
              employers, and accommodation requests appear only if the candidate chose to share
              them.
            </p>
            {applicants.length ? (
              <div className="mt-4 max-w-md">
                <label htmlFor="applicant-search" className="sr-only">
                  Search applicants
                </label>
                <Input
                  id="applicant-search"
                  type="search"
                  value={applicantSearch}
                  onChange={(event) => setApplicantSearch(event.target.value)}
                  placeholder="Search by candidate, skills, job, or status"
                />
              </div>
            ) : null}
            {applicants.length === 0 ? (
              <p className="surface-card mt-4 p-5 text-sm text-muted-foreground">
                No applicants yet for your posted roles.
              </p>
            ) : (
              <>
                {filteredApplicants.length === 0 ? (
                  <p className="surface-card mt-4 p-5 text-sm text-muted-foreground">
                    No applicants match your search.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {filteredApplicants.map((a) => {
                      const job = findJob(a.jobId);
                      return (
                        <li key={a.jobId} className="surface-card p-5">
                          <h3 className="font-semibold">{profile.name || "Candidate"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Applied {a.date} • {job?.title}
                          </p>
                          <dl className="mt-3 space-y-2 text-sm">
                            <div>
                              <dt className="text-muted-foreground">Skills</dt>
                              <dd>
                                {profile.skills.length
                                  ? profile.skills.join(" • ")
                                  : "Not provided"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Experience</dt>
                              <dd>{profile.experienceBand || "Not provided"}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Education</dt>
                              <dd>{profile.education || "Not provided"}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Resume</dt>
                              <dd>{a.resumeName}</dd>
                            </div>
                            {a.shareAccommodations && a.accommodations.length ? (
                              <div>
                                <dt className="text-muted-foreground">
                                  Interview accommodation requested by candidate
                                </dt>
                                <dd>{a.accommodations.join(", ")}</dd>
                              </div>
                            ) : null}
                          </dl>
                          <div className="mt-3">
                            <label
                              htmlFor={`status-${a.jobId}`}
                              className="block text-sm font-medium"
                            >
                              Application status
                            </label>
                            <Select
                              value={a.status}
                              onValueChange={(v) => {
                                setApplicationStatus(a.jobId, v as ApplicationStatus);
                                toast.success(`Status updated to ${v}`);
                              }}
                            >
                              <SelectTrigger id={`status-${a.jobId}`} className="mt-1.5 max-w-56">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {APPLICATION_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {a.status === "Interview" ? (
                              <div className="mt-3 max-w-md">
                                <label
                                  htmlFor={`meeting-link-${a.jobId}`}
                                  className="block text-sm font-medium"
                                >
                                  Interview meeting link
                                </label>
                                <Input
                                  id={`meeting-link-${a.jobId}`}
                                  type="url"
                                  value={a.interviewMeetingLink ?? ""}
                                  onChange={(event) =>
                                    setInterviewMeetingLink(a.jobId, event.target.value)
                                  }
                                  placeholder="https://meet.google.com/..."
                                  className="mt-1.5"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                  This link is visible to you and the candidate in the application
                                  tracker.
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <div className="mt-10">
        <CandidateTalentMap />
      </div>

      <div className="mt-10">
        <InclusionIntelligence />
      </div>
    </div>
  );
}
