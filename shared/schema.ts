import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  
  // New fields for RadOrderPad
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  role: text("role"),
  invitationStatus: text("invitation_status").default("pending"),
  primaryLocation: text("primary_location"),
  lastLogin: timestamp("last_login", { mode: 'string' }),
  npi: varchar("npi", { length: 10 }),
  specialty: text("specialty"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  invitationStatus: true,
  primaryLocation: true,
  npi: true,
  specialty: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Extend the insert schema for organization users import
export const orgUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  role: z.string(),
  npi: z.string().optional(),
  specialty: z.string().optional(),
  primaryLocation: z.string().optional(),
});

export type OrgUser = z.infer<typeof orgUserSchema>;
