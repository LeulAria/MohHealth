import { randomUUID } from "crypto";
import { desc, eq, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";
import { ORPCError } from "@orpc/server";
import { db } from "@my-better-t-app/db";
import {
	letter,
	letterAuditLog,
	letterComment,
} from "@my-better-t-app/db/schema/letter";
import { user } from "@my-better-t-app/db/schema/auth";
import { protectedProcedure } from "../index";

const LETTER_STATUSES = [
	"draft",
	"pending_approval",
	"approved",
	"rejected",
	"stamped",
	"locked",
	"archived",
] as const;

type Session = {
	user: {
		id: string;
		role?: string | null;
		[key: string]: unknown;
	};
};

const isAdmin = (session: Session) => {
	const role = (session.user as any)?.role;
	return role === "admin" || role === "መሪ ስራ አስፈፃሚ" || role === "lead_executive";
};

const isRecordsSection = (session: Session) => {
	const role = (session.user as any)?.role;
	return role === "መዝገብ ክፍል" || role === "records_section";
};

async function insertAuditLog(
	letterId: string,
	userId: string,
	action: string,
	details?: unknown,
) {
	await db.insert(letterAuditLog).values({
		id: randomUUID(),
		letterId,
		userId,
		action,
		details,
	});
}

async function getLetterRow(letterId: string) {
	const [record] = await db.select().from(letter).where(eq(letter.id, letterId));
	if (!record) {
		throw new Error("Letter not found");
	}
	return record;
}

function assertAccess(letterData: typeof letter.$inferSelect, session: Session) {
	if (isAdmin(session)) {
		return;
	}

	// Records section can view approved and stamped letters
	if (isRecordsSection(session) && (letterData.status === "approved" || letterData.status === "stamped")) {
		return;
	}

	if (letterData.createdBy !== session.user.id) {
		throw new Error("Unauthorized");
	}
}

async function fetchLetterDetail(letterId: string, session: Session) {
	const letterData = await getLetterRow(letterId);
	assertAccess(letterData, session);

	const relatedUserIds = [
		letterData.createdBy,
		letterData.approvedBy,
		letterData.rejectedBy,
		letterData.stampedBy,
	].filter((id): id is string => !!id);

	const userMap =
		relatedUserIds.length > 0
			? Object.fromEntries(
					(
						await db
							.select({
								id: user.id,
								name: user.name,
								image: user.image,
								role: user.role,
							})
							.from(user)
							.where(inArray(user.id, relatedUserIds))
					).map((u) => [u.id, u]),
			  )
			: {};

	const auditUser = alias(user, "auditUser");
	const auditLogs = await db
		.select({
			id: letterAuditLog.id,
			action: letterAuditLog.action,
			details: letterAuditLog.details,
			createdAt: letterAuditLog.createdAt,
			user: {
				id: auditUser.id,
				name: auditUser.name,
				role: auditUser.role,
				image: auditUser.image,
			},
		})
		.from(letterAuditLog)
		.leftJoin(auditUser, eq(auditUser.id, letterAuditLog.userId))
		.where(eq(letterAuditLog.letterId, letterId))
		.orderBy(desc(letterAuditLog.createdAt));

	const commentUser = alias(user, "commentUser");
	const comments = await db
		.select({
			id: letterComment.id,
			content: letterComment.content,
			createdAt: letterComment.createdAt,
			user: {
				id: commentUser.id,
				name: commentUser.name,
				role: commentUser.role,
				image: commentUser.image,
			},
		})
		.from(letterComment)
		.leftJoin(commentUser, eq(commentUser.id, letterComment.userId))
		.where(eq(letterComment.letterId, letterId))
		.orderBy(letterComment.createdAt);

	return {
		...letterData,
		createdByUser: letterData.createdBy
			? userMap[letterData.createdBy] ?? null
			: null,
		approvedByUser: letterData.approvedBy
			? userMap[letterData.approvedBy] ?? null
			: null,
		rejectedByUser: letterData.rejectedBy
			? userMap[letterData.rejectedBy] ?? null
			: null,
		stampedByUser: letterData.stampedBy
			? userMap[letterData.stampedBy] ?? null
			: null,
		auditLogs,
		comments,
	};
}

export const letterRouter = {
	getAll: protectedProcedure.handler(async ({ context }) => {
		// If user is admin, return all letters
		if (isAdmin(context.session)) {
			const letters = await db
				.select()
				.from(letter)
				.orderBy(desc(letter.createdAt));
			return letters;
		}

		// If user is records_section, return approved and stamped letters
		if (isRecordsSection(context.session)) {
			const letters = await db
				.select()
				.from(letter)
				.where(
					or(eq(letter.status, "approved"), eq(letter.status, "stamped"))
				)
				.orderBy(desc(letter.createdAt));
			return letters;
		}

		// Otherwise return only letters created by the user
		const letters = await db
			.select()
			.from(letter)
			.where(eq(letter.createdBy, context.session.user.id))
			.orderBy(desc(letter.createdAt));

		return letters;
	}),

	getByStatus: protectedProcedure
		.input(z.object({ status: z.enum(LETTER_STATUSES) }))
		.handler(async ({ input, context }) => {
			if (!isAdmin(context.session)) {
				throw new Error("Unauthorized");
			}

			const lettersByStatus = await db
				.select()
				.from(letter)
				.where(eq(letter.status, input.status))
				.orderBy(desc(letter.createdAt));

			return lettersByStatus;
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			return await fetchLetterDetail(input.id, context.session);
		}),

	create: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				type: z.enum(["internal", "external"]),
				direction: z.enum(["incoming", "outgoing"]),
				referenceNumber: z.string().optional(),
				date: z.any().optional(),
				to: z.string().optional(),
				from: z.string(),
				subject: z.string().optional(),
				content: z.any().optional(),
				attachments: z.any().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const userId = context.session.user.id;
				if (!userId) {
					throw new ORPCError("UNAUTHORIZED", {
						message: "User ID is missing from session",
					});
				}

				// Verify user exists
				const [existingUser] = await db
					.select()
					.from(user)
					.where(eq(user.id, userId))
					.limit(1);
				
				if (!existingUser) {
					throw new ORPCError("NOT_FOUND", {
						message: `User with ID ${userId} does not exist in database`,
					});
				}

				const now = new Date();
				
				// Convert date if it's a string
				let dateValue: Date | undefined = undefined;
				if (input.date) {
					dateValue = input.date instanceof Date ? input.date : new Date(input.date);
				}
				
				// Build values object, only including defined fields
				const letterValues: any = {
					id: input.id,
					type: input.type,
					direction: input.direction,
					from: input.from,
					createdBy: userId,
					status: "draft",
					createdAt: now,
					updatedAt: now,
				};
				
				if (input.referenceNumber !== undefined) {
					letterValues.referenceNumber = input.referenceNumber;
				}
				if (dateValue !== undefined) {
					letterValues.date = dateValue;
				}
				if (input.to !== undefined) {
					letterValues.to = input.to;
				}
				if (input.subject !== undefined) {
					letterValues.subject = input.subject;
				}
				if (input.content !== undefined) {
					letterValues.content = input.content;
				}
				if (input.attachments !== undefined) {
					letterValues.attachments = input.attachments;
				}
				
				const [newLetter] = await db
					.insert(letter)
					.values(letterValues)
					.returning();

				if (!newLetter) {
					throw new Error("Failed to create letter");
				}

				// Insert audit log (non-blocking - if it fails, we still return the letter)
				try {
					await insertAuditLog(
						newLetter.id,
						context.session.user.id,
						"created",
						{ subject: input.subject },
					);
				} catch (auditError) {
					console.error("Failed to insert audit log:", auditError);
					// Continue even if audit log fails
				}

				return newLetter;
			} catch (error) {
				console.error("Error creating letter:", error);
				console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
				console.error("Error details:", JSON.stringify(error, null, 2));
				
				if (error instanceof Error) {
					// Check if it's a database error with more details
					const errorMessage = error.message || "Unknown error";
					const errorDetails = (error as any).cause || (error as any).detail || "";
					
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: `Failed to create letter: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`,
					});
				}
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create letter: Unknown error",
				});
			}
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				referenceNumber: z.string().optional(),
				date: z.date().optional(),
				to: z.string().optional(),
				from: z.string().optional(),
				subject: z.string().optional(),
				content: z.any().optional(),
				attachments: z.any().optional(),
				status: z.enum(LETTER_STATUSES).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const letterData = await getLetterRow(input.id);
			assertAccess(letterData, context.session);

			const [updatedLetter] = await db
				.update(letter)
				.set({ ...input, updatedAt: new Date() })
				.where(eq(letter.id, input.id))
				.returning();

			return updatedLetter;
		}),

	review: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				action: z.enum(["approve", "reject"]),
				note: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			if (!isAdmin(context.session)) {
				throw new Error("Unauthorized");
			}

			const now = new Date();

			if (input.action === "approve") {
				await db
					.update(letter)
					.set({
						status: "approved",
						approvedBy: context.session.user.id,
						approvedAt: now,
						rejectedBy: null,
						rejectedAt: null,
						updatedAt: now,
					})
					.where(eq(letter.id, input.id));
			} else {
				await db
					.update(letter)
					.set({
						status: "rejected",
						rejectedBy: context.session.user.id,
						rejectedAt: now,
						updatedAt: now,
					})
					.where(eq(letter.id, input.id));
			}

			await insertAuditLog(input.id, context.session.user.id, input.action, {
				note: input.note,
			});

			if (input.note) {
				await db.insert(letterComment).values({
					id: randomUUID(),
					letterId: input.id,
					userId: context.session.user.id,
					content: input.note,
				});
			}

			return await fetchLetterDetail(input.id, context.session);
		}),

	addComment: protectedProcedure
		.input(
			z.object({
				letterId: z.string(),
				content: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			const letterData = await getLetterRow(input.letterId);
			assertAccess(letterData, context.session);

			await db.insert(letterComment).values({
				id: randomUUID(),
				letterId: input.letterId,
				userId: context.session.user.id,
				content: input.content,
			});

			await insertAuditLog(input.letterId, context.session.user.id, "comment", {
				preview: input.content.slice(0, 50),
			});

			return await fetchLetterDetail(input.letterId, context.session);
		}),

	stamp: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			if (!isRecordsSection(context.session)) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Only records section can stamp letters",
				});
			}

			const letterData = await getLetterRow(input.id);
			
			// Check if already stamped
			if (letterData.status === "stamped") {
				// If already stamped by the same user, just return the letter
				if (letterData.stampedBy === context.session.user.id) {
					return await fetchLetterDetail(input.id, context.session);
				}
				throw new ORPCError("BAD_REQUEST", {
					message: "Letter has already been stamped",
				});
			}

			// Only allow stamping approved letters
			if (letterData.status !== "approved") {
				throw new ORPCError("BAD_REQUEST", {
					message: `Only approved letters can be stamped. Current status: ${letterData.status}`,
				});
			}

			const now = new Date();

			try {
				await db
					.update(letter)
					.set({
						status: "stamped",
						stampedBy: context.session.user.id,
						stampedAt: now,
						updatedAt: now,
					})
					.where(eq(letter.id, input.id));

				await insertAuditLog(input.id, context.session.user.id, "stamped", {
					letterId: input.id,
				});

				return await fetchLetterDetail(input.id, context.session);
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: `Failed to stamp letter: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		}),
};

