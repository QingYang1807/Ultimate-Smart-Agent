import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providerConfigs = pgTable("provider_configs", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  apiKey: text("api_key"),
  baseUrl: text("base_url"),
  enabled: boolean("enabled").notNull().default(false),
  selectedModel: text("selected_model"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertProviderConfigSchema = createInsertSchema(providerConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertProviderConfigSchema = z.object({
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  selectedModel: z.string().nullable().optional(),
});

export type ProviderConfig = typeof providerConfigs.$inferSelect;
export type InsertProviderConfig = z.infer<typeof insertProviderConfigSchema>;
export type UpsertProviderConfig = z.infer<typeof upsertProviderConfigSchema>;
