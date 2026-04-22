import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn(
        { err: error, code: error.code, status: error.statusCode },
        "AppError handled",
      );
      reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if (error instanceof ZodError) {
      request.log.warn({ err: error }, "Request payload failed validation");
      reply.code(400).send({
        error: {
          code: "invalid_request",
          message: "Request payload failed validation",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    request.log.error({ err: error }, "Unhandled error");
    reply.code(500).send({
      error: { code: "internal_error", message: "Internal server error" },
    });
  });

  app.setNotFoundHandler((_, reply) => {
    reply.code(404).send({
      error: { code: "not_found", message: "Route not found" },
    });
  });
}
