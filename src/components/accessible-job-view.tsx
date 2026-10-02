import { ACCESS_FEATURES, INCLUSION_FEATURES, type Job } from "@/lib/jobs-data";

/**
 * An alternative, strictly structured presentation of a listing. The original
 * description stays available — this is a second way to read the same facts.
 */
export function AccessibleJobView({ job }: { job: Job }) {
  const blocks: { heading: string; items: string[] }[] = [
    { heading: "Role", items: [job.title] },
    { heading: "Company", items: [job.company] },
    { heading: "What you will do", items: job.responsibilities },
    { heading: "Required skills", items: job.requiredSkills },
    { heading: "Preferred skills", items: job.preferredSkills },
    { heading: "Work arrangement", items: [job.workMode, job.city, job.employment, `${job.experience} experience`] },
    {
      heading: "Accessibility",
      items: job.access.length
        ? job.access.map((a) => `${ACCESS_FEATURES[a]} (${job.accessSource.toLowerCase()})`)
        : ["Not provided by the employer"],
    },
    {
      heading: "Inclusion",
      items: job.inclusion.length ? job.inclusion.map((i) => INCLUSION_FEATURES[i]) : ["Not specified"],
    },
    { heading: "Salary", items: [job.salary ?? "Not disclosed"] },
    { heading: "How to apply", items: ["Use the Apply button on this page. Interview preferences are optional."] },
  ];

  return (
    <div className="mt-4 space-y-5">
      {blocks.map((b) => (
        <section key={b.heading} aria-labelledby={`av-${b.heading.replace(/\s+/g, "-")}`}>
          <h3 id={`av-${b.heading.replace(/\s+/g, "-")}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {b.heading}
          </h3>
          {b.items.length === 1 ? (
            <p className="mt-1 text-base">{b.items[0]}</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-base">
              {b.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
