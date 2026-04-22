import { z } from "zod";

export const WorkModeSchema = z.enum(["remote", "hybrid", "onsite"]);
export type WorkMode = z.infer<typeof WorkModeSchema>;

export const UserPreferencesSchema = z.object({
  experienceYears: z.number().int().min(0).max(60),
  roles: z.array(z.string().min(1)).default([]),
  techStack: z.array(z.string().min(1)).default([]),
  locations: z.array(z.string().min(1)).default([]),
  workType: z.array(WorkModeSchema).default([]),
  minSalary: z.string().optional().default(""),
  dealBreakers: z.array(z.string().min(1)).default([]),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const JobDataSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().default(""),
  description: z.string().min(1),
});
export type JobData = z.infer<typeof JobDataSchema>;

export const AnalyzeRequestSchema = z.object({
  job: JobDataSchema,
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AnalyzeTagSchema = z.object({
  label: z.string().min(1).max(40),
  detail: z.string().min(1).max(200).optional(),
});
export type AnalyzeTag = z.infer<typeof AnalyzeTagSchema>;

export const AnalyzeResultSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  matches: z.array(AnalyzeTagSchema).min(0).max(10),
  mismatches: z.array(AnalyzeTagSchema).min(0).max(10),
  summary: z.string().min(1).max(400),
});
export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;
