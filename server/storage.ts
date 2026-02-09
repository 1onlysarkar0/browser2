import { 
  automations, 
  type Automation, 
  type InsertAutomation,
  type Step
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAutomations(): Promise<Automation[]>;
  getAutomation(id: number): Promise<Automation | undefined>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(id: number, automation: Partial<InsertAutomation>): Promise<Automation>;
  deleteAutomation(id: number): Promise<void>;
  updateAutomationStatus(id: number, status: string): Promise<void>;
  updateLastRun(id: number, timestamp: Date): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAutomations(): Promise<Automation[]> {
    return await db.select().from(automations);
  }

  async getAutomation(id: number): Promise<Automation | undefined> {
    const [automation] = await db.select().from(automations).where(eq(automations.id, id));
    return automation;
  }

  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    const [automation] = await db.insert(automations).values(insertAutomation).returning();
    return automation;
  }

  async updateAutomation(id: number, updates: Partial<InsertAutomation>): Promise<Automation> {
    const [updated] = await db
      .update(automations)
      .set(updates)
      .where(eq(automations.id, id))
      .returning();
    return updated;
  }

  async deleteAutomation(id: number): Promise<void> {
    await db.delete(automations).where(eq(automations.id, id));
  }

  async updateAutomationStatus(id: number, status: string): Promise<void> {
    // Cast strict enum to string for flexibility if needed, or validate
    await db.update(automations).set({ status: status as any }).where(eq(automations.id, id));
  }

  async updateLastRun(id: number, timestamp: Date): Promise<void> {
    await db.update(automations).set({ lastRun: timestamp }).where(eq(automations.id, id));
  }
}

export const storage = new DatabaseStorage();
