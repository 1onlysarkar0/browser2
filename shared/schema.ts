import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Automation status enum
export const automationStatusEnum = ["stopped", "running", "error"] as const;
export const stepTypeEnum = ["goto", "click", "type", "wait"] as const;

// Define the schema for a single step (stored as JSON)
export const stepSchema = z.object({
  id: z.string(),
  type: z.enum(stepTypeEnum),
  selector: z.string().optional(),
  value: z.string().optional(), // text to type or seconds to wait
});

export type Step = z.infer<typeof stepSchema>;

export const automations = sqliteTable("automations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  schedule: text("schedule"), // cron or interval string
  // Store steps as a JSON string, parsed at runtime
  steps: text("steps", { mode: "json" }).$type<Step[]>().notNull(),
  status: text("status", { enum: automationStatusEnum }).default("stopped").notNull(),
  lastRun: integer("last_run", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

export const insertAutomationSchema = createInsertSchema(automations).extend({
  steps: z.array(stepSchema),
});

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type AutomationStatus = typeof automationStatusEnum[number];
