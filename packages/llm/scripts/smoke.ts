/**
 * Manual smoke test for the LLM adapter.
 *
 * Usage (from repo root):
 *   LLM_PROVIDER=openai OPENAI_API_KEY=sk-... pnpm --filter @job-fit/llm smoke
 *
 * Exits 0 on a valid, schema-conformant response; non-zero on any error.
 */
import { AnalyzeResultSchema, buildPrompt, UserPreferencesSchema } from "@job-fit/shared";
import { createLlmClient } from "../src/index.js";

const SAMPLE_PREFS = UserPreferencesSchema.parse({
  experienceYears: 5,
  roles: ["backend", "fullstack"],
  techStack: ["node.js", "typescript", "postgres", "aws"],
  locations: ["remote", "bangalore"],
  workType: ["remote"],
  minSalary: "INR 40L",
  dealBreakers: ["on-call rotations > 1 week/month"],
});

const SAMPLE_JOB = {
  title: "Senior Backend Engineer",
  company: "Contoso",
  location: "Remote (India)",
  description: [
    "We are looking for a Senior Backend Engineer to join our platform team.",
    "You will design and operate distributed systems in Node.js and TypeScript on AWS.",
    "Requirements: 6+ years of backend experience, strong Postgres, experience with SQS/SNS.",
    "Nice to have: exposure to Terraform, on-call comfort.",
    "Compensation: competitive; fully remote within India.",
  ].join("\n"),
};

async function main(): Promise<void> {
  const client = createLlmClient();
  console.info(`[smoke] provider=${client.provider} model=${client.model}`);

  const { system, user } = buildPrompt({
    job: SAMPLE_JOB,
    userPreferences: SAMPLE_PREFS,
  });

  const started = Date.now();
  const result = await client.complete({
    system,
    user,
    schema: AnalyzeResultSchema,
    schemaName: "AnalyzeResult",
    temperature: 0.2,
    maxOutputTokens: 600,
  });
  const elapsedMs = Date.now() - started;

  console.info(`[smoke] ok in ${elapsedMs}ms`);
  console.info(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`[smoke] failed: ${(error as Error).message}`);
  if (error && typeof error === "object" && "raw" in error) {
    console.error("[smoke] raw payload:", (error as { raw: unknown }).raw);
  }
  process.exit(1);
});
