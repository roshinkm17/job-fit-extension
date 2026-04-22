import { createLlmClient } from "@job-fit/llm";
import { buildApp } from "./app.js";
import { createSupabaseSessionFactory } from "./auth/session.js";
import { loadConfig } from "./config.js";
import { createAnalyzeService } from "./services/analyze.js";

async function main(): Promise<void> {
  const config = loadConfig();

  const sessionFactory = createSupabaseSessionFactory({
    supabaseUrl: config.supabase.url,
    supabasePublishableKey: config.supabase.publishableKey,
  });

  const llmClient = createLlmClient();
  const analyzeService = createAnalyzeService(llmClient, {
    temperature: config.llm.temperature,
    maxOutputTokens: config.llm.maxOutputTokens,
  });

  const app = await buildApp({ config, sessionFactory, analyzeService });

  await app.listen({ port: config.port, host: config.host });
}

main().catch((error) => {
  console.error(`[backend] failed to start: ${(error as Error).message}`);
  process.exit(1);
});
