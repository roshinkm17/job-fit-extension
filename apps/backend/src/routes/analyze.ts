import { AnalyzeRequestSchema } from "@job-fit/shared";
import type { FastifyInstance } from "fastify";
import type { SessionFactory } from "../auth/session.js";
import type { AnalyzeService } from "../services/analyze.js";

export interface AnalyzeRouteDeps {
  readonly sessionFactory: SessionFactory;
  readonly analyzeService: AnalyzeService;
}

export function registerAnalyzeRoute(app: FastifyInstance, deps: AnalyzeRouteDeps): void {
  app.post("/analyze", async (request, reply) => {
    const session = await deps.sessionFactory.fromAuthHeader(request.headers.authorization);
    const payload = AnalyzeRequestSchema.parse(request.body);
    const preferences = await session.fetchPreferences();
    const result = await deps.analyzeService.analyze(payload, preferences);
    reply.code(200).send(result);
  });
}
