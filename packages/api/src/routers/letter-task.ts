// @ts-nocheck
import { randomUUID } from "crypto";
import { eq, desc, and, inArray } from "drizzle-orm";
import z from "zod";
import { ORPCError } from "@orpc/server";
import { db } from "@my-better-t-app/db";
import { letter } from "@my-better-t-app/db/schema/letter";
import { user } from "@my-better-t-app/db/schema/auth";
import {
  letterTask,
  letterTaskAssignment,
  letterTaskComment,
  letterTaskTag,
} from "@my-better-t-app/db/schema/letter-task";
import { protectedProcedure } from "../index";

const TASK_STATUSES = ["open", "acknowledged", "active", "progress", "assigned", "in_review", "done", "closed"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const letterTaskRouter = {
  // Forward letter as task
  forwardAsTask: protectedProcedure
    .input(
      z.object({
        letterId: z.string(),
        assignedUserIds: z.array(z.string()).min(1),
        priority: z.enum(PRIORITIES).optional(),
        deadline: z.union([z.date(), z.string()]).optional().transform((val) => {
          if (!val) return undefined;
          if (typeof val === "string") return new Date(val);
          return val;
        }),
        remarks: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      try {
        // Verify letter exists and is incoming
        const [letterData] = await db
          .select()
          .from(letter)
          .where(eq(letter.id, input.letterId));

        if (!letterData) {
          throw new ORPCError("NOT_FOUND", { message: "Letter not found" });
        }

        if (letterData.direction !== "incoming") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Only incoming letters can be forwarded as tasks",
          });
        }

        // Check if task already exists (handle missing tables)
        let existingTask = null;
        try {
          const tasks = await db
            .select()
            .from(letterTask)
            .where(eq(letterTask.letterId, input.letterId))
            .limit(1);
          existingTask = tasks[0] || null;
        } catch (error: any) {
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes("does not exist") || errorMessage.includes("relation")) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Task management tables are not set up yet. Please run database migrations.",
            });
          }
          throw error;
        }

        if (existingTask) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Task already exists for this letter",
          });
        }

        // Create task
        const taskId = randomUUID();
        await db.insert(letterTask).values({
          id: taskId,
          letterId: input.letterId,
          status: "open",
          priority: input.priority || "medium",
          deadline: input.deadline,
          remarks: input.remarks,
          createdBy: context.session.user.id,
        });

        // Create assignments
        await db.insert(letterTaskAssignment).values(
          input.assignedUserIds.map((userId) => ({
            id: randomUUID(),
            taskId,
            userId,
            assignedBy: context.session.user.id,
          }))
        );

        // Add Task tag to letter
        await db.insert(letterTaskTag).values({
          id: randomUUID(),
          letterId: input.letterId,
          tag: "Task",
        });

        return { taskId, success: true };
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const errorString = JSON.stringify(error || {});
        const causeMessage = error?.cause?.message || "";
        const fullErrorText = `${errorMessage} ${errorString} ${causeMessage}`;
        
        // If tables don't exist, return a helpful error message
        if (fullErrorText.includes("does not exist") || fullErrorText.includes("relation")) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Task management tables are not set up yet. Please run database migrations.",
          });
        }
        
        // Re-throw ORPCErrors as-is
        if (error instanceof ORPCError) {
          throw error;
        }
        
        // Handle other errors
        console.error("Error forwarding as task:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to forward letter as task: ${errorMessage}`,
        });
      }
    }),

  // Get tasks for a letter
  getByLetterId: protectedProcedure
    .input(z.object({ letterId: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const tasks = await db
          .select()
          .from(letterTask)
          .where(eq(letterTask.letterId, input.letterId))
          .orderBy(desc(letterTask.createdAt));

      if (tasks.length === 0) {
        return [];
      }

      // Get assignments for each task
      const taskIds = tasks.map((t) => t.id);
      const assignments = await db
        .select()
        .from(letterTaskAssignment)
        .where(inArray(letterTaskAssignment.taskId, taskIds));

      // Get comments for each task
      const comments = await db
        .select()
        .from(letterTaskComment)
        .where(inArray(letterTaskComment.taskId, taskIds))
        .orderBy(letterTaskComment.createdAt);

      // Get user info - include mentioned user IDs from comments
      const allMentionedUserIds = comments
        .map((c) => {
          if (!c.mentionedUserIds) return [];
          // Handle both array and non-array JSONB values
          if (Array.isArray(c.mentionedUserIds)) {
            return c.mentionedUserIds;
          }
          // If it's a string, try to parse it
          if (typeof c.mentionedUserIds === 'string') {
            try {
              const parsed = JSON.parse(c.mentionedUserIds);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        })
        .flat();

      const userIds = [
        ...new Set([
          ...tasks.map((t) => t.createdBy),
          ...assignments.map((a) => a.userId),
          ...assignments.map((a) => a.assignedBy),
          ...comments.map((c) => c.userId),
          ...allMentionedUserIds,
        ]),
      ];

      const users = userIds.length > 0
        ? await db
            .select({ id: user.id, name: user.name, email: user.email, image: user.image, role: user.role })
            .from(user)
            .where(inArray(user.id, userIds))
        : [];

      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      return tasks.map((task) => ({
        ...task,
        assignments: assignments
          .filter((a) => a.taskId === task.id)
          .map((a) => ({
            ...a,
            user: userMap[a.userId],
            assignedByUser: userMap[a.assignedBy],
          })),
        comments: comments
          .filter((c) => c.taskId === task.id)
          .map((c) => {
            // Safely extract mentionedUserIds
            let mentionedIds: string[] = [];
            if (c.mentionedUserIds) {
              if (Array.isArray(c.mentionedUserIds)) {
                mentionedIds = c.mentionedUserIds;
              } else if (typeof c.mentionedUserIds === 'string') {
                try {
                  const parsed = JSON.parse(c.mentionedUserIds);
                  mentionedIds = Array.isArray(parsed) ? parsed : [];
                } catch {
                  mentionedIds = [];
                }
              }
            }
            
            return {
              ...c,
              user: userMap[c.userId],
              mentionedUsers: mentionedIds.map((id) => userMap[id]).filter(Boolean),
              parentComment: c.parentCommentId ? comments.find((pc) => pc.id === c.parentCommentId) : null,
            };
          }),
        createdByUser: userMap[task.createdBy],
      }));
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const errorString = JSON.stringify(error || {});
        const causeMessage = error?.cause?.message || "";
        const fullErrorText = `${errorMessage} ${errorString} ${causeMessage}`;
        
        // If tables don't exist, return empty array instead of error
        if (fullErrorText.includes("does not exist") || fullErrorText.includes("relation")) {
          console.warn("Task tables don't exist yet, returning empty array");
          return [];
        }
        console.error("Error fetching tasks:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        const errorDetails = error?.cause || error?.detail || "";
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to fetch tasks: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`,
        });
      }
    }),

  // Add comment to task
  addComment: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        content: z.string().min(1),
        parentCommentId: z.string().optional(),
        mentionedUserIds: z.array(z.string()).optional(),
        statusUpdate: z.enum(TASK_STATUSES).optional(),
        priorityUpdate: z.enum(PRIORITIES).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const commentId = randomUUID();
      await db.insert(letterTaskComment).values({
        id: commentId,
        taskId: input.taskId,
        userId: context.session.user.id,
        content: input.content,
        parentCommentId: input.parentCommentId,
        mentionedUserIds: input.mentionedUserIds || [],
        statusUpdate: input.statusUpdate,
        priorityUpdate: input.priorityUpdate,
      });

      // Update task status/priority if provided
      if (input.statusUpdate || input.priorityUpdate) {
        const updates: any = { updatedAt: new Date() };
        if (input.statusUpdate) updates.status = input.statusUpdate;
        if (input.priorityUpdate) updates.priority = input.priorityUpdate;
        await db.update(letterTask).set(updates).where(eq(letterTask.id, input.taskId));
      }

      return { commentId, success: true };
    }),

  // Update task status
  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(TASK_STATUSES),
      })
    )
    .handler(async ({ input, context }) => {
      await db
        .update(letterTask)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(letterTask.id, input.taskId));

      return { success: true };
    }),

  // Get letters with tasks (for filtering)
  getLettersWithTasks: protectedProcedure
    .input(
      z.object({
        taskStatus: z.enum(TASK_STATUSES).optional(),
        direction: z.enum(["incoming"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      let query = db
        .selectDistinct({ letterId: letterTask.letterId })
        .from(letterTask);

      if (input.taskStatus) {
        query = query.where(eq(letterTask.status, input.taskStatus)) as any;
      }

      const taskLetters = await query;
      const letterIds = taskLetters.map((t) => t.letterId);

      if (letterIds.length === 0) {
        return [];
      }

      const letters = await db
        .select()
        .from(letter)
        .where(
          and(
            inArray(letter.id, letterIds),
            input.direction ? eq(letter.direction, input.direction) : undefined
          )
        )
        .orderBy(desc(letter.createdAt));

      return letters;
    }),

  // Get all users for autocomplete
  getAllUsers: protectedProcedure.handler(async ({ context }) => {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      })
      .from(user)
      .orderBy(user.name);

    return users;
  }),

  // Check if letter has task tag
  hasTaskTag: protectedProcedure
    .input(z.object({ letterId: z.string() }))
    .handler(async ({ input }) => {
      try {
        const [tag] = await db
          .select()
          .from(letterTaskTag)
          .where(eq(letterTaskTag.letterId, input.letterId))
          .limit(1);

        return { hasTask: !!tag };
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const errorString = JSON.stringify(error || {});
        const causeMessage = error?.cause?.message || "";
        const fullErrorText = `${errorMessage} ${errorString} ${causeMessage}`;
        
        // If tables don't exist, return false instead of error
        if (fullErrorText.includes("does not exist") || fullErrorText.includes("relation")) {
          console.warn("Task tables don't exist yet, returning hasTask: false");
          return { hasTask: false };
        }
        console.error("Error checking task tag:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        const errorDetails = error?.cause || error?.detail || "";
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to check task tag: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`,
        });
      }
    }),
};

