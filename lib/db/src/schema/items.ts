import { pgTable, text, serial, integer, bigint, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["file", "folder"] }).notNull(),
  parentId: integer("parent_id"),
  objectPath: text("object_path"),
  mimeType: text("mime_type"),
  size: bigint("size", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
