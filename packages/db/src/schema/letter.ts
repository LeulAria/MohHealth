import { pgTable, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const letter = pgTable("letter", {
	id: text("id").primaryKey(),
	type: text("type").notNull(), // 'internal' | 'external'
	direction: text("direction").notNull(), // 'incoming' | 'outgoing'
	status: text("status").notNull().default("draft"), // 'draft' | 'pending_approval' | 'approved' | 'stamped' | 'locked' | 'archived'
	
	// Letter metadata
	referenceNumber: text("reference_number"),
	date: timestamp("date"),
	
	// Recipient/From fields
	to: text("to"), // For dropdown selection
	from: text("from").notNull(), // Sender role/name
	subject: text("subject"),
	content: jsonb("content"), // Plate.js editor content
	
	// Workflow
	assignedTo: text("assigned_to").references(() => user.id),
	approvedBy: text("approved_by").references(() => user.id),
	approvedAt: timestamp("approved_at"),
	stampedBy: text("stamped_by").references(() => user.id),
	stampedAt: timestamp("stamped_at"),
	lockedAt: timestamp("locked_at"),
	
	// Attachments
	attachments: jsonb("attachments"), // Array of attachment metadata
	
	// Audit
	createdBy: text("created_by").notNull().references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const letterComment = pgTable("letter_comment", {
	id: text("id").primaryKey(),
	letterId: text("letter_id").notNull().references(() => letter.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const letterAuditLog = pgTable("letter_audit_log", {
	id: text("id").primaryKey(),
	letterId: text("letter_id").notNull().references(() => letter.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id),
	action: text("action").notNull(), // 'created', 'updated', 'approved', 'assigned', 'commented', 'stamped', 'locked'
	details: jsonb("details"), // Additional action details
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

