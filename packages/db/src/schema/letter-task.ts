import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { letter } from "./letter";
import { user } from "./auth";

export const letterTask = pgTable("letter_task", {
  id: text("id").primaryKey(),
  letterId: text("letter_id").notNull().references(() => letter.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("open"), // 'open', 'acknowledged', 'active', 'progress', 'assigned', 'in_review', 'done', 'closed'
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  deadline: timestamp("deadline"),
  remarks: text("remarks"),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const letterTaskAssignment = pgTable("letter_task_assignment", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => letterTask.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  assignedBy: text("assigned_by").notNull().references(() => user.id),
});

export const letterTaskComment = pgTable("letter_task_comment", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => letterTask.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  parentCommentId: text("parent_comment_id").references(() => letterTaskComment.id, { onDelete: "cascade" }),
  mentionedUserIds: jsonb("mentioned_user_ids"), // Array of user IDs
  statusUpdate: text("status_update"), // If comment updates status
  priorityUpdate: text("priority_update"), // If comment updates priority
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const letterTaskTag = pgTable("letter_task_tag", {
  id: text("id").primaryKey(),
  letterId: text("letter_id").notNull().references(() => letter.id, { onDelete: "cascade" }),
  tag: text("tag").notNull().default("Task"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

