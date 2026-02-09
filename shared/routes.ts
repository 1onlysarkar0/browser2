import { z } from "zod";
import { insertAutomationSchema, automations, stepSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  automations: {
    list: {
      method: "GET" as const,
      path: "/api/automations" as const,
      responses: {
        200: z.array(z.custom<typeof automations.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/automations/:id" as const,
      responses: {
        200: z.custom<typeof automations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/automations" as const,
      input: insertAutomationSchema,
      responses: {
        201: z.custom<typeof automations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/automations/:id" as const,
      input: insertAutomationSchema.partial(),
      responses: {
        200: z.custom<typeof automations.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/automations/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    start: {
      method: "POST" as const,
      path: "/api/automations/:id/start" as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    stop: {
      method: "POST" as const,
      path: "/api/automations/:id/stop" as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  health: {
    check: {
      method: "GET" as const,
      path: "/api/health" as const,
      responses: {
        200: z.object({
          status: z.string(),
          browser: z.enum(["running", "stopped", "error"]),
        }),
      },
    },
  },
  proxy: {
    get: {
      method: "GET" as const,
      path: "/api/proxy" as const,
      input: z.object({ url: z.string() }),
      responses: {
        200: z.string(), // HTML content
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AutomationResponse = z.infer<typeof api.automations.list.responses[200]>[number];
export type InsertAutomationInput = z.infer<typeof api.automations.create.input>;
export type StepInput = z.infer<typeof stepSchema>;
