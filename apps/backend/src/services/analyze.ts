import type { LlmClient } from "@job-fit/llm";
import { LlmError } from "@job-fit/llm";
import {
  type AnalyzeRequest,
  type AnalyzeResult,
  AnalyzeResultSchema,
  buildPrompt,
  type UserPreferences,
} from "@job-fit/shared";
import { LlmFailureError } from "../errors.js";

export interface AnalyzeServiceConfig {
  readonly temperature: number;
  readonly maxOutputTokens: number;
}

export interface AnalyzeService {
  analyze(request: AnalyzeRequest, preferences: UserPreferences): Promise<AnalyzeResult>;
}

export function createAnalyzeService(
  llmClient: LlmClient,
  config: AnalyzeServiceConfig,
): AnalyzeService {
  return {
    async analyze(request, preferences) {
      const { system, user } = buildPrompt({
        job: request.job,
        userPreferences: preferences,
      });

      try {
        return await llmClient.complete({
          system,
          user,
          schema: AnalyzeResultSchema,
          schemaName: "AnalyzeResult",
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
        });
      } catch (error) {
        if (error instanceof LlmError) {
          throw new LlmFailureError(error.message, error);
        }
        throw error;
      }
    },
  };
}
