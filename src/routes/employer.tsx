import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
  type WorkMode,
} from "@/lib/jobs-data";
import type { EmployerJob, StoredApplication, JobStatus } from "@/lib/jobs.server";
import {
  createJob,
  updateJob,
  publishJob,
  closeJob,
  listMyJobs,
  listApplicationsForEmployer,
  updateApplicationStatus,
} from "@/lib/jobs.functions";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/app-state";
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

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function EmployerPage() {
  const [form, setForm] = useState(EMPTY);
  const [access, setAccess] = useState<AccessFeature[]>([]);
  const [inclusion, setInclusion] = useState<InclusionFeature[]>([]);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [applicantSearch, setApplicantSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Server-backed state
  const [myJobs, setMyJobs] = useState<EmployerJob[]>([]);
  const [applications, setApplications] = useState<StoredApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Load employer's jobs and applications from server
  const refreshData = useCallback(async () => {
    try {
      const [jobsResult, appsResult] = await Promise.all([
        listMyJobs({ data: undefined }),
        listApplicationsForEmployer({ data: {} }),
      ]);
      if (jobsResult.ok) setMyJobs(jobsResult.jobs);
      if (appsResult.ok && "applications" in appsResult) setApplications(appsResult.applications);
    } catch (err) {
      console.warn("Failed to load employer data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const normalizedSearch = applicantSearch.trim().toLowerCase();
  const filteredApplicants = applications.filter((a) => {
    if (!normalizedSearch) return true;
    const job = myJobs.find((j) => j.id === a.jobId);
    return [a.candidateName, job?.title, job?.company, a.status]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedSearch));
  });

  const startEditing = (job: EmployerJob) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      city: job.location === "Remote (India)" ? "" : job.location,
      salary: job.salaryRange ?? "",
      about: job.description,
      skills: job.skills.join(", "),
      workMode: job.workMode,
      employment: job.employmentType,
      experience: job.experienceLevel,
    });
    setAccess(job.accessibilityFeatures.map((f) => f.key));
    setInclusion(job.inclusionFeatures);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetJobForm = () => {
    setForm(EMPTY);
    setAccess([]);
    setInclusion([]);
    setEditingJobId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (access.length === 0) {
      toast.error("Select the accessibility support available for this role.");
      return;
    }

    setSubmitting(true);
    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const accessFeatures = access.map((key) => ({
        key,
        status: "employer-provided" as const,
      }));

      if (editingJobId) {
        const result = await updateJob({
          data: {
            jobId: editingJobId,
            title: form.title,
            company: form.company,
            description: form.about,
            location: form.workMode === "Remote" ? "Remote (India)" : form.city,
            workMode: form.workMode,
            employmentType: form.employment,
            experienceLevel: form.experience,
            skills,
            salaryRange: form.salary || undefined,
            accessibilityFeatures: accessFeatures,
            inclusionFeatures: inclusion,
          },
        });
        if (result.ok) {
          toast.success("Job post updated");
          resetJobForm();
          void refreshData();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createJob({
          data: {
            title: form.title,
            company: form.company,
            description: form.about,
            location: form.workMode === "Remote" ? "Remote (India)" : form.city,
            workMode: form.workMode,
            employmentType: form.employment,
            experienceLevel: form.experience,
            skills,
            salaryRange: form.salary || undefined,
            accessibilityFeatures: accessFeatures,
            inclusionFeatures: inclusion,
            status: "draft",
          },
        });
        if (result.ok) {
          toast.success("Job saved as draft. Preview and publish when ready.");
          resetJobForm();
          void refreshData();
        } else {
          toast.error(result.error);
        }
      }
    } catch (err) {
      toast.error("Failed to save job. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (jobId: string) => {
    try {
      const result = await publishJob({ data: { jobId } });
      if (result.ok) {
        toast.success("Job published and live on AccessPath");
        void refreshData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to publish job.");
    }
  };

  const handleClose = async (jobId: string) => {
    try {
      const result = await closeJob({ data: { jobId } });
      if (result.ok) {
        toast.success("Job closed");
        void refreshData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to close job.");
    }
  };

  const handleStatusChange = async (
    applicationId: string,
    status: ApplicationStatus,
    meetingLink?: string,
  ) => {
    try {
      const result = await updateApplicationStatus({
        data: {
          applicationId,
          status,
          interviewMeetingLink: meetingLink,
        },
      });
      if (result.ok) {
        toast.success(`Status updated to ${status}`);
        void refreshData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update status.");
    }
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
          <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
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

            <div className="flex gap-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? "Saving…" : editingJobId ? "Save changes" : "Save as draft"}
              </Button>
              {editingJobId ? (
                <Button type="button" variant="outline" size="lg" onClick={resetJobForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <div className="space-y-8">
          <section aria-labelledby="posted-heading">
            <h2 id="posted-heading" className="text-2xl font-bold">
              Your posted jobs
            </h2>
            {loading ? (
              <p className="surface-card mt-4 p-5 text-sm text-muted-foreground">
                Loading your jobs…
              </p>
            ) : myJobs.length === 0 ? (
              <p className="surface-card mt-4 p-5 text-sm text-muted-foreground">
                No jobs posted yet. Jobs saved as drafts appear here. Publish when ready.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {myJobs.map((j) => (
                  <li key={j.id} className="surface-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{j.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {j.company} • {j.location} • {j.workMode} • {j.experienceLevel}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 text-xs ${STATUS_COLORS[j.status]}`}
                        variant="outline"
                      >
                        {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(j)}
                      >
                        Edit
                      </Button>
                      {j.status === "draft" ? (
                        <Button type="button" size="sm" onClick={() => handlePublish(j.id)}>
                          Publish
                        </Button>
                      ) : null}
                      {j.status === "published" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleClose(j.id)}
                        >
                          Close listing
                        </Button>
                      ) : null}
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {j.accessibilityFeatures.map((f) => (
                        <li key={f.key}>
                          <Badge variant="secondary" className="font-normal">
                            {ACCESS_FEATURES[f.key] || f.key}
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
            {applications.length ? (
              <div className="mt-4 max-w-md">
                <label htmlFor="applicant-search" className="sr-only">
                  Search applicants
                </label>
                <Input
                  id="applicant-search"
                  type="search"
                  value={applicantSearch}
                  onChange={(event) => setApplicantSearch(event.target.value)}
                  placeholder="Search by candidate, job, or status"
                />
              </div>
            ) : null}
            {loading ? (
              <p className="surface-card mt-4 p-5 text-sm text-muted-foreground">
                Loading applicants…
              </p>
            ) : applications.length === 0 ? (
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
                      const job = myJobs.find((j) => j.id === a.jobId);
                      return (
                        <li key={a.id} className="surface-card p-5">
                          <h3 className="font-semibold">{a.candidateName || "Candidate"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Applied {new Date(a.createdAt).toLocaleDateString()} • {job?.title}
                          </p>
                          <dl className="mt-3 space-y-2 text-sm">
                            {a.resumeName ? (
                              <div>
                                <dt className="text-muted-foreground">Resume</dt>
                                <dd>{a.resumeName}</dd>
                              </div>
                            ) : null}
                            {a.matchScore > 0 ? (
                              <div>
                                <dt className="text-muted-foreground">Match score</dt>
                                <dd>{a.matchScore}%</dd>
                              </div>
                            ) : null}
                            {a.coverLetter ? (
                              <div>
                                <dt className="text-muted-foreground">Cover letter</dt>
                                <dd className="whitespace-pre-line">{a.coverLetter}</dd>
                              </div>
                            ) : null}
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
                            <label htmlFor={`status-${a.id}`} className="block text-sm font-medium">
                              Application status
                            </label>
                            <Select
                              value={a.status}
                              onValueChange={(v) =>
                                handleStatusChange(a.id, v as ApplicationStatus)
                              }
                            >
                              <SelectTrigger id={`status-${a.id}`} className="mt-1.5 max-w-56">
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
                                  htmlFor={`meeting-link-${a.id}`}
                                  className="block text-sm font-medium"
                                >
                                  Interview meeting link
                                </label>
                                <Input
                                  id={`meeting-link-${a.id}`}
                                  type="url"
                                  defaultValue={a.interviewMeetingLink ?? ""}
                                  onBlur={(event) =>
                                    handleStatusChange(a.id, "Interview", event.target.value)
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
