import { type UserPreferences, UserPreferencesSchema } from "@job-fit/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PreferenceRow {
  user_id: string;
  experience_years: number;
  roles: string[];
  tech_stack: string[];
  locations: string[];
  work_type: string[];
  min_salary: string;
  deal_breakers: string[];
}

export const EMPTY_PREFERENCES: UserPreferences = {
  experienceYears: 0,
  roles: [],
  techStack: [],
  locations: [],
  workType: [],
  minSalary: "",
  dealBreakers: [],
};

export function mapRowToPreferences(row: Partial<PreferenceRow>): UserPreferences {
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

export function mapPreferencesToRow(userId: string, preferences: UserPreferences): PreferenceRow {
  return {
    user_id: userId,
    experience_years: preferences.experienceYears,
    roles: preferences.roles,
    tech_stack: preferences.techStack,
    locations: preferences.locations,
    work_type: preferences.workType,
    min_salary: preferences.minSalary,
    deal_breakers: preferences.dealBreakers,
  };
}

export async function loadPreferences(
  client: SupabaseClient,
  userId: string,
): Promise<UserPreferences | null> {
  const { data, error } = await client
    .from("user_preferences")
    .select(
      "user_id, experience_years, roles, tech_stack, locations, work_type, min_salary, deal_breakers",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load preferences: ${error.message}`);
  if (!data) return null;
  return mapRowToPreferences(data as PreferenceRow);
}

export async function savePreferences(
  client: SupabaseClient,
  userId: string,
  preferences: UserPreferences,
): Promise<UserPreferences> {
  const row = mapPreferencesToRow(userId, preferences);
  const { data, error } = await client
    .from("user_preferences")
    .upsert(row, { onConflict: "user_id" })
    .select(
      "user_id, experience_years, roles, tech_stack, locations, work_type, min_salary, deal_breakers",
    )
    .single();

  if (error) throw new Error(`Failed to save preferences: ${error.message}`);
  return mapRowToPreferences(data as PreferenceRow);
}
