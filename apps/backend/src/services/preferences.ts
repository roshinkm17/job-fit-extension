import { type UserPreferences, UserPreferencesSchema } from "@job-fit/shared";

export interface PreferenceRow {
  readonly user_id: string;
  readonly experience_years: number | null;
  readonly roles: readonly string[] | null;
  readonly tech_stack: readonly string[] | null;
  readonly locations: readonly string[] | null;
  readonly work_type: readonly string[] | null;
  readonly min_salary: string | null;
  readonly deal_breakers: readonly string[] | null;
}

/**
 * Translate a `user_preferences` row from Supabase into the shared zod-validated
 * {@link UserPreferences} shape consumed by the prompt builder.
 */
export function mapDbRowToPreferences(row: PreferenceRow): UserPreferences {
  return UserPreferencesSchema.parse({
    experienceYears: row.experience_years ?? 0,
    roles: row.roles ?? [],
    techStack: row.tech_stack ?? [],
    locations: row.locations ?? [],
    workType: row.work_type ?? [],
    minSalary: row.min_salary ?? "",
    dealBreakers: row.deal_breakers ?? [],
  });
}
