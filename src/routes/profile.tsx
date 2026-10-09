import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck, User } from "lucide-react";
import { useAppState } from "@/lib/app-state";
import { ACCESS_FEATURES } from "@/lib/jobs-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, updateProfile } = useAppState();
  const [saved, setSaved] = useState(false);

  const toggleAccPref = (key: string) => {
    const arr = profile.accessibilityPreferences;
    const next = arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];
    updateProfile({ accessibilityPreferences: next });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Candidate Profile &amp; Accommodations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your skills, experience, and confidential workplace accommodation needs.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">Personal Information</CardTitle>
            <CardDescription className="text-xs">
              Your name and contact information shared with employers upon application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => updateProfile({ displayName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pronouns" className="text-xs">Pronouns (Optional)</Label>
                <Input
                  id="pronouns"
                  value={profile.pronouns}
                  onChange={(e) => updateProfile({ pronouns: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="headline" className="text-xs">Professional Headline</Label>
              <Input
                id="headline"
                value={profile.headline}
                onChange={(e) => updateProfile({ headline: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accommodation Preferences */}
        <Card className="surface-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-brand" />
              <CardTitle className="text-base font-bold">Accommodations You Rely On</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Select the features that empower your daily work. We use this to compute your Accommodation Fit scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(ACCESS_FEATURES).map(([key, feat]) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/20 p-2.5 text-xs text-foreground cursor-pointer hover:border-brand/40 transition-colors"
                >
                  <Checkbox
                    checked={profile.accessibilityPreferences.includes(key)}
                    onCheckedChange={() => toggleAccPref(key)}
                  />
                  <span aria-hidden="true">✓</span>
                  <span className="font-medium truncate">{feat}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 items-center">
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="size-3.5" /> Changes saved
            </span>
          )}
          <Button type="submit" className="bg-[#7BD3C2] text-[#141817] hover:bg-[#68c5b3] font-semibold text-xs px-6">
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
