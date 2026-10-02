import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DEFAULT_PRIVACY, useAppState } from "@/lib/app-state";
import { isShared, privacyPreview, privacyRows } from "@/lib/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "My Privacy — AccessPath" },
      {
        name: "description",
        content:
          "Control exactly what employers see on AccessPath. Disability and gender identity are never required, and accessibility preferences stay private by default.",
      },
      { property: "og:title", content: "My Privacy — AccessPath" },
      {
        property: "og:description",
        content: "You control what employers see: preferred name, pronouns, accessibility preferences and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function StatusPill({ shared }: { shared: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        shared
          ? "border-brand/40 bg-brand/10 text-foreground"
          : "border-border bg-secondary text-foreground"
      }`}
    >
      {shared ? (
        <Eye aria-hidden="true" className="size-3.5" />
      ) : (
        <Lock aria-hidden="true" className="size-3.5" />
      )}
      {shared ? "Shared" : "Private"}
    </span>
  );
}

function PrivacyPage() {
  const { profile, saveProfile } = useAppState();
  const [announcement, setAnnouncement] = useState("");
  const rows = privacyRows(profile);
  const preview = privacyPreview(profile);

  const setField = (field: NonNullable<ReturnType<typeof privacyRows>[number]["field"]>, value: boolean, label: string) => {
    saveProfile({ ...profile, [field]: value });
    setAnnouncement(`${label} is now ${value ? "shared with employers" : "private"}.`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">My privacy</h1>
      <p className="mt-2 flex items-start gap-2 text-lg font-medium">
        <ShieldCheck aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand" />
        You control what employers see.
      </p>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        You never have to disclose a disability or a transgender or gender identity to use
        AccessPath. Nothing on this page changes your job matches — accessibility preferences are
        used only to show you how well a workplace fits how you work.
      </p>

      <p aria-live="polite" className="sr-only">{announcement}</p>

      <section aria-labelledby="fields-heading" className="surface-card mt-6 p-5">
        <h2 id="fields-heading" className="text-xl font-semibold">Profile information</h2>
        <ul className="mt-4 divide-y divide-border">
          {rows.map((row) => {
            const shared = isShared(row, profile);
            const switchId = `privacy-${row.key}`;
            return (
              <li key={row.key} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{row.label}</h3>
                  <p className="text-sm text-muted-foreground">{row.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.help}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill shared={shared} />
                  {row.mode === "toggle" && row.field ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        id={switchId}
                        checked={shared}
                        onCheckedChange={(v) => setField(row.field!, v, row.label)}
                      />
                      <label htmlFor={switchId} className="text-xs text-muted-foreground">
                        Share {row.label.toLowerCase()}
                      </label>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {row.mode === "always"
                        ? "Always shared — this is your professional profile"
                        : row.mode === "on-apply"
                          ? "Shared only when you apply"
                          : "Never collected"}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="preview-heading" className="surface-card mt-6 p-5">
        <h2 id="preview-heading" className="text-xl font-semibold">Privacy preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An example of what an employer can see if you apply right now.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <Eye aria-hidden="true" className="size-4 text-brand" />
              Employer will see
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              {preview.shared.map((item) => (
                <div key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <EyeOff aria-hidden="true" className="size-4" />
              Employer will not see
            </h3>
            {preview.hidden.length ? (
              <dl className="mt-3 space-y-3 text-sm">
                {preview.hidden.map((item) => (
                  <div key={item.label}>
                    <dt className="font-medium">{item.label}</dt>
                    <dd className="text-muted-foreground">{item.reason}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Everything on your profile is currently set to shared. You can switch any field back
                to private above.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="reset-heading" className="surface-card mt-6 p-5">
        <h2 id="reset-heading" className="text-xl font-semibold">Reset privacy settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Return every switch to the private-first defaults. Your profile details are not deleted.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-3">Reset privacy settings</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset privacy settings?</AlertDialogTitle>
              <AlertDialogDescription>
                Pronouns, legal name, accessibility preferences and interview preferences will go
                back to private. Your preferred name stays shared so employers can address you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  saveProfile({ ...profile, ...DEFAULT_PRIVACY });
                  setAnnouncement("Privacy settings reset to the private-first defaults.");
                  toast.success("Privacy settings reset");
                }}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}