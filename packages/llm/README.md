# @job-fit/llm

Provider-agnostic LLM adapter with strict Zod validation at the boundary.

## Usage

```ts
import { z } from "zod";
import { createLlmClient } from "@job-fit/llm";

const Schema = z.object({ answer: z.string() });

const client = createLlmClient(); // reads LLM_PROVIDER / LLM_MODEL / *_API_KEY
const { answer } = await client.complete({
  system: "You are a concise assistant.",
  user: "Say hi.",
  schema: Schema,
  temperature: 0.2,
});
```

## Environment variables

| Variable | Required when | Default |
| --- | --- | --- |
| `LLM_PROVIDER` | always (optional) | `openai` |
| `LLM_MODEL` | optional | provider default (see below) |
| `OPENAI_API_KEY` | provider=openai | — |
| `OPENAI_BASE_URL` | optional | OpenAI public endpoint |
| `ANTHROPIC_API_KEY` | provider=anthropic | — |
| `ANTHROPIC_BASE_URL` | optional | Anthropic public endpoint |
| `GROQ_API_KEY` | provider=groq | — |
| `GROQ_BASE_URL` | optional | `https://api.groq.com/openai/v1` |

Default models:

| Provider | Default model | Ballpark cost per analyze call |
| --- | --- | --- |
| `openai` | `gpt-4o-mini` | ~$0.0008 |
| `anthropic` | `claude-3-5-haiku-latest` | ~$0.004 |
| `groq` | `llama-3.3-70b-versatile` | ~$0.001 |

Override via `LLM_MODEL=...` — e.g. `LLM_MODEL=gpt-4.1-nano` for cheaper OpenAI inference.

## Smoke test

```bash
LLM_PROVIDER=openai OPENAI_API_KEY=sk-... pnpm --filter @job-fit/llm smoke
```

Prints a fully validated `AnalyzeResult` JSON object and exits 0 on success.

## Design notes

- Each provider is implemented in its own file under `src/providers/` to keep files well under the 500-line limit.
- OpenAI uses the SDK's `beta.chat.completions.parse` helper with `zodResponseFormat` — the provider enforces the schema server-side. Other providers rely on prompt-level JSON guardrails + post-hoc Zod validation.
- All non-network failures surface as `LlmValidationError` (bad schema) or `LlmInvocationError` (network/HTTP). Call sites should only need to catch `LlmError` to distinguish our errors from runtime crashes.
