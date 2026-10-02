import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/job-card";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Jobs — AccessPath" },
      { name: "description", content: "Review the jobs you saved on AccessPath and decide where to apply." },
      { property: "og:title", content: "Saved Jobs — AccessPath" },
      { property: "og:description", content: "Your shortlist of inclusive job opportunities." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { savedJobs, allJobs } = useAppState();
  const jobs = allJobs.filter((j) => savedJobs.includes(j.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Saved jobs</h1>
      <p className="mt-2 text-muted-foreground" aria-live="polite">
        {jobs.length} {jobs.length === 1 ? "job" : "jobs"} saved on this device.
      </p>

      {jobs.length === 0 ? (
        <div className="surface-card mt-6 p-6">
          <h2 className="font-semibold">Nothing saved yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save roles while you search so you can compare accessibility details later.
          </p>
          <Button asChild className="mt-4">
            <Link to="/jobs" search={{ q: "" }}>Find jobs</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
