import { XIcon } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export interface TagInputProps {
  readonly label: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly values: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly maxTags?: number;
}

/** Comma- or Enter-delimited chip input for string[] prefs (roles, tech, etc.). */
export function TagInput({
  label,
  description,
  placeholder,
  values,
  onChange,
  maxTags = 30,
}: TagInputProps) {
  const inputId = useId();
  const [draft, setDraft] = useState("");

  function commitDraft(raw: string) {
    const next = new Set(values);
    for (const piece of raw.split(",")) {
      const token = piece.trim();
      if (token.length > 0 && next.size < maxTags) next.add(token);
    }
    onChange([...next]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim().length > 0) commitDraft(draft);
      return;
    }
    if (event.key === "Backspace" && draft.length === 0 && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(values.filter((value) => value !== tag));
  }

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            <span>{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
            >
              <XIcon />
            </Button>
          </Badge>
        ))}
      </div>
      <Input
        id={inputId}
        value={draft}
        placeholder={placeholder ?? "Type and press Enter"}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim().length > 0 && commitDraft(draft)}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
