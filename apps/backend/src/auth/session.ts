import type { UserPreferences } from "@job-fit/shared";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PreferencesMissingError, UnauthenticatedError } from "../errors.js";
import { mapDbRowToPreferences } from "../services/preferences.js";

export interface AuthenticatedSession {
  readonly userId: string;
  fetchPreferences(): Promise<UserPreferences>;
}

export interface SessionFactoryConfig {
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
}

export interface SessionFactory {
  fromAuthHeader(header: string | undefined): Promise<AuthenticatedSession>;
}

const BEARER_PREFIX = "Bearer ";

/**
 * Create a session factory that verifies the caller's Supabase JWT and returns
 * a helper that can load their preferences via RLS-enforced queries.
 *
 * Verification is delegated to Supabase Auth (`auth.getUser`). Pref fetches
 * reuse the same authenticated client so RLS policies apply automatically.
 */
export function createSupabaseSessionFactory(config: SessionFactoryConfig): SessionFactory {
  return {
    async fromAuthHeader(header: string | undefined): Promise<AuthenticatedSession> {
      const token = extractBearerToken(header);
      const client = buildAuthedClient(config, token);

      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        throw new UnauthenticatedError(
          error?.message ?? "Token could not be verified",
          "invalid_auth",
        );
      }

      const userId = data.user.id;
      return {
        userId,
        async fetchPreferences(): Promise<UserPreferences> {
          const { data: row, error: selectError } = await client
            .from("user_preferences")
            .select(
              "user_id, experience_years, roles, tech_stack, locations, work_type, min_salary, deal_breakers",
            )
            .eq("user_id", userId)
            .maybeSingle();

          if (selectError) {
            throw new UnauthenticatedError(
              `Failed to load preferences: ${selectError.message}`,
              "invalid_auth",
            );
          }
          if (!row) throw new PreferencesMissingError();
          return mapDbRowToPreferences(row);
        },
      };
    },
  };
}

function extractBearerToken(header: string | undefined): string {
  if (!header) throw new UnauthenticatedError("Authorization header is required");
  if (!header.startsWith(BEARER_PREFIX)) {
    throw new UnauthenticatedError("Authorization header must use Bearer scheme");
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  if (token.length === 0) throw new UnauthenticatedError("Bearer token is empty");
  return token;
}

function buildAuthedClient(config: SessionFactoryConfig, token: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
