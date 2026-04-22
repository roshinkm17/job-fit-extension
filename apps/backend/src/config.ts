import { z } from "zod";

const ConfigSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  host: z.string().default("0.0.0.0"),
  logLevel: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  /** Comma-separated list of allowed CORS origins. Empty string means allow none. */
  corsAllowedOrigins: z.array(z.string().url()).default([]),
  supabase: z.object({
    url: z.string().url(),
    publishableKey: z.string().min(1),
  }),
  llm: z.object({
    temperature: z.coerce.number().min(0).max(2).default(0.2),
    maxOutputTokens: z.coerce.number().int().min(64).max(4096).default(600),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const corsRaw = env.BACKEND_CORS_ORIGINS ?? "";
  const corsAllowedOrigins = corsRaw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const parsed = ConfigSchema.safeParse({
    nodeEnv: env.NODE_ENV,
    port: env.BACKEND_PORT ?? env.PORT,
    host: env.BACKEND_HOST,
    logLevel: env.BACKEND_LOG_LEVEL,
    corsAllowedOrigins,
    supabase: {
      url: env.SUPABASE_URL,
      publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
    },
    llm: {
      temperature: env.ANALYZE_TEMPERATURE,
      maxOutputTokens: env.ANALYZE_MAX_OUTPUT_TOKENS,
    },
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid backend configuration: ${issues}`);
  }

  return parsed.data;
}
