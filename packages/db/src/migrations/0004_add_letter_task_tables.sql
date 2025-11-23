CREATE TABLE "letter_task" (
	"id" text PRIMARY KEY NOT NULL,
	"letter_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium',
	"deadline" timestamp,
	"remarks" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letter_task_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letter_task_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" text,
	"mentioned_user_ids" jsonb,
	"status_update" text,
	"priority_update" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letter_task_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"letter_id" text NOT NULL,
	"tag" text DEFAULT 'Task' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "letter_task" ADD CONSTRAINT "letter_task_letter_id_letter_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letter"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task" ADD CONSTRAINT "letter_task_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_assignment" ADD CONSTRAINT "letter_task_assignment_task_id_letter_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."letter_task"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_assignment" ADD CONSTRAINT "letter_task_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_assignment" ADD CONSTRAINT "letter_task_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_comment" ADD CONSTRAINT "letter_task_comment_task_id_letter_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."letter_task"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_comment" ADD CONSTRAINT "letter_task_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_comment" ADD CONSTRAINT "letter_task_comment_parent_comment_id_letter_task_comment_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."letter_task_comment"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "letter_task_tag" ADD CONSTRAINT "letter_task_tag_letter_id_letter_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letter"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "letter_task_letter_id_idx" ON "letter_task"("letter_id");
--> statement-breakpoint
CREATE INDEX "letter_task_status_idx" ON "letter_task"("status");
--> statement-breakpoint
CREATE INDEX "letter_task_assignment_task_id_idx" ON "letter_task_assignment"("task_id");
--> statement-breakpoint
CREATE INDEX "letter_task_assignment_user_id_idx" ON "letter_task_assignment"("user_id");
--> statement-breakpoint
CREATE INDEX "letter_task_comment_task_id_idx" ON "letter_task_comment"("task_id");
--> statement-breakpoint
CREATE INDEX "letter_task_tag_letter_id_idx" ON "letter_task_tag"("letter_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "letter_task_tag_letter_id_tag_unique" ON "letter_task_tag"("letter_id", "tag");
