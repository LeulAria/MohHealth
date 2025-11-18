CREATE TABLE "letter" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"direction" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"reference_number" text,
	"date" timestamp,
	"to" text,
	"from" text NOT NULL,
	"subject" text,
	"content" jsonb,
	"assigned_to" text,
	"approved_by" text,
	"approved_at" timestamp,
	"stamped_by" text,
	"stamped_at" timestamp,
	"locked_at" timestamp,
	"attachments" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letter_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"letter_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "letter_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"letter_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "letter" ADD CONSTRAINT "letter_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter" ADD CONSTRAINT "letter_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter" ADD CONSTRAINT "letter_stamped_by_user_id_fk" FOREIGN KEY ("stamped_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter" ADD CONSTRAINT "letter_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_audit_log" ADD CONSTRAINT "letter_audit_log_letter_id_letter_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_audit_log" ADD CONSTRAINT "letter_audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_comment" ADD CONSTRAINT "letter_comment_letter_id_letter_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_comment" ADD CONSTRAINT "letter_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;