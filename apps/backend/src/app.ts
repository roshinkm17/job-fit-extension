import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import type { SessionFactory } from "./auth/session.js";
import type { AppConfig } from "./config.js";
import { registerErrorHandler } from "./plugins/errors.js";
import { registerAnalyzeRoute } from "./routes/analyze.js";
import { registerHealthRoute } from "./routes/health.js";
import type { AnalyzeService } from "./services/analyze.js";

export interface AppDeps {
  readonly config: AppConfig;
  readonly sessionFactory: SessionFactory;
  readonly analyzeService: AnalyzeService;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildLoggerOptions(deps.config),
    disableRequestLogging: false,
    trustProxy: true,
  });

  await app.register(sensible);
  await app.register(cors, {
    origin: deps.config.corsAllowedOrigins.length > 0 ? deps.config.corsAllowedOrigins : false,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  registerErrorHandler(app);
  registerHealthRoute(app);
  registerAnalyzeRoute(app, {
    sessionFactory: deps.sessionFactory,
    analyzeService: deps.analyzeService,
  });

  return app;
}

function buildLoggerOptions(config: AppConfig) {
  const base = {
    level: config.logLevel,
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "responseTime"],
      censor: "[redacted]",
    },
  };
  if (config.nodeEnv !== "production") {
    return {
      ...base,
      transport: {
        target: "pino-pretty",
        options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
      },
    };
  }
  return base;
}
