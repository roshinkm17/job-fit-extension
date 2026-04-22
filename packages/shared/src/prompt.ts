import type { JobData, UserPreferences } from "./schemas.js";

const MAX_DESCRIPTION_CHARS = 12_000;

export function truncateDescription(description: string, maxChars = MAX_DESCRIPTION_CHARS): string {
  if (description.length <= maxChars) return description;
  return description.slice(0, maxChars) + "\n\n[...truncated for length]";
}

export interface PromptInput {
  job: JobData;
  userPreferences: UserPreferences;
}

export interface PromptOutput {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = `You are a job-fit evaluation engine.

Your job: compare a candidate's saved preferences against a job description and produce a structured fit analysis.

RULES (non-negotiable):
- Output STRICT JSON matching the schema provided. No prose, no code fences, no markdown.
- Never invent facts about the job or the candidate. If the job description is silent on something, say so instead of guessing.
- Ignore boilerplate, legal/EEO language, and generic benefit copy when forming judgments.
- Be decisive but honest. Avoid hedging that adds no information.

SCORING RUBRIC (weights):
- Skills & tech stack alignment .......... 40%
- Years of experience & seniority fit .... 20%
- Location / work mode (remote/hybrid/onsite) / salary ... 20%
- Role type, responsibilities, scope ..... 20%

OUTPUT SHAPE (JSON):
{
  "fitScore": integer 0-100,
  "matches":    array of up to 6 concise bullet strings describing concrete alignments,
  "mismatches": array of up to 6 concise bullet strings describing concrete misalignments,
  "summary":    a single 1-2 sentence plain-English summary (<= 240 chars)
}

Bullets must reference specifics from both sides (e.g. "Node.js required — matches candidate's stack"). Avoid generic filler.`;

export function buildPrompt(input: PromptInput): PromptOutput {
  const { job, userPreferences: prefs } = input;
  const description = truncateDescription(job.description);

  const userMessage = [
    "CANDIDATE PREFERENCES:",
    `- Years of experience: ${prefs.experienceYears}`,
    `- Preferred roles: ${prefs.roles.join(", ") || "(none set)"}`,
    `- Tech stack: ${prefs.techStack.join(", ") || "(none set)"}`,
    `- Preferred locations: ${prefs.locations.join(", ") || "(none set)"}`,
    `- Work mode preferences: ${prefs.workType.join(", ") || "(none set)"}`,
    `- Minimum salary: ${prefs.minSalary || "(not specified)"}`,
    `- Deal breakers: ${prefs.dealBreakers.join("; ") || "(none)"}`,
    "",
    "JOB:",
    `- Title: ${job.title}`,
    `- Company: ${job.company}`,
    `- Location: ${job.location || "(not specified)"}`,
    "",
    "JOB DESCRIPTION:",
    description,
    "",
    "Now produce the JSON analysis. Respond with JSON only.",
  ].join("\n");

  return { system: SYSTEM_PROMPT, user: userMessage };
}
