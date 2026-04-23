import type { UserPreferences, WorkMode } from "@job-fit/shared";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EMPTY_PREFERENCES, loadPreferences, savePreferences } from "@/lib/preferences";
import { TagInput } from "./TagInput";

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

export function PreferencesForm() {
  const { user, supabase } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(EMPTY_PREFERENCES);
  const [dealBreakersDraft, setDealBreakersDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    loadPreferences(supabase, user.id)
      .then((prefs) => {
        if (cancelled) return;
        if (prefs) {
          setPreferences(prefs);
          setDealBreakersDraft(prefs.dealBreakers.join("\n"));
        }
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function parseDealBreakers(raw: string): string[] {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    try {
      const payload: UserPreferences = {
        ...preferences,
        dealBreakers: parseDealBreakers(dealBreakersDraft),
      };
      const saved = await savePreferences(supabase, user.id, payload);
      setPreferences(saved);
      setDealBreakersDraft(saved.dealBreakers.join("\n"));
      toast.success("Preferences saved.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Your job preferences</CardTitle>
          <CardDescription>
            Used by RoleGauge to score LinkedIn jobs. No job data is ever stored — only these
            settings.
          </CardDescription>
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="experienceYears">Years of experience</FieldLabel>
              <Input
                id="experienceYears"
                type="number"
                min={0}
                max={60}
                inputMode="numeric"
                value={preferences.experienceYears}
                onChange={(event) =>
                  update("experienceYears", Number.parseInt(event.target.value, 10) || 0)
                }
              />
              <FieldDescription>Total professional years, rounded down.</FieldDescription>
            </Field>

            <TagInput
              label="Preferred roles"
              description="e.g. Backend Engineer, Platform Engineer, Staff Engineer"
              placeholder="Add a role and press Enter"
              values={preferences.roles}
              onChange={(next) => update("roles", next)}
            />

            <TagInput
              label="Tech stack"
              description="Languages, frameworks, databases you want to work with"
              placeholder="e.g. TypeScript, Node.js, Postgres"
              values={preferences.techStack}
              onChange={(next) => update("techStack", next)}
            />

            <TagInput
              label="Preferred locations"
              description="City, region, or country names. Use 'Remote' for remote-only."
              placeholder="e.g. Remote, Berlin, Bengaluru"
              values={preferences.locations}
              onChange={(next) => update("locations", next)}
            />

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Work mode</FieldLegend>
              <FieldDescription>Pick all that would be acceptable to you.</FieldDescription>
              <ToggleGroup
                type="multiple"
                variant="outline"
                spacing={2}
                value={preferences.workType}
                onValueChange={(values) => update("workType", values as WorkMode[])}
              >
                {WORK_MODES.map((mode) => (
                  <ToggleGroupItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <Field>
              <FieldLabel htmlFor="minSalary">Minimum salary</FieldLabel>
              <Input
                id="minSalary"
                placeholder="e.g. $180k, €90k, 40 LPA"
                value={preferences.minSalary}
                onChange={(event) => update("minSalary", event.target.value)}
              />
              <FieldDescription>
                Free-form. Currency and unit are fine; the model reads it literally.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="dealBreakers">Deal breakers</FieldLabel>
              <Textarea
                id="dealBreakers"
                rows={3}
                placeholder="One per line. e.g. On-call rotations > 1 week/month"
                value={dealBreakersDraft}
                onChange={(event) => setDealBreakersDraft(event.target.value)}
              />
              <FieldDescription>These carry heavy negative weight during scoring.</FieldDescription>
            </Field>

            <Button type="submit" size="lg" className="self-start" disabled={saving || loading}>
              {saving ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              {saving ? "Saving..." : "Save preferences"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
