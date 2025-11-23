-- Script to verify and add missing constraints/indexes for letter_task tables
-- Run this manually if needed: psql $DATABASE_URL -f verify-task-tables.sql

-- Check if tables exist
SELECT 'letter_task' as table_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'letter_task') as exists;
SELECT 'letter_task_assignment' as table_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'letter_task_assignment') as exists;
SELECT 'letter_task_comment' as table_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'letter_task_comment') as exists;
SELECT 'letter_task_tag' as table_name, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'letter_task_tag') as exists;

-- Add missing foreign keys
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_letter_id_letter_id_fk') THEN
    ALTER TABLE "letter_task" ADD CONSTRAINT "letter_task_letter_id_letter_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letter"("id") ON DELETE cascade ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_letter_id_letter_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_created_by_user_id_fk') THEN
    ALTER TABLE "letter_task" ADD CONSTRAINT "letter_task_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_created_by_user_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_assignment_task_id_letter_task_id_fk') THEN
    ALTER TABLE "letter_task_assignment" ADD CONSTRAINT "letter_task_assignment_task_id_letter_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."letter_task"("id") ON DELETE cascade ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_assignment_task_id_letter_task_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_assignment_user_id_user_id_fk') THEN
    ALTER TABLE "letter_task_assignment" ADD CONSTRAINT "letter_task_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_assignment_user_id_user_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_assignment_assigned_by_user_id_fk') THEN
    ALTER TABLE "letter_task_assignment" ADD CONSTRAINT "letter_task_assignment_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_assignment_assigned_by_user_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_comment_task_id_letter_task_id_fk') THEN
    ALTER TABLE "letter_task_comment" ADD CONSTRAINT "letter_task_comment_task_id_letter_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."letter_task"("id") ON DELETE cascade ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_comment_task_id_letter_task_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_comment_user_id_user_id_fk') THEN
    ALTER TABLE "letter_task_comment" ADD CONSTRAINT "letter_task_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_comment_user_id_user_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_comment_parent_comment_id_letter_task_comment_id_fk') THEN
    ALTER TABLE "letter_task_comment" ADD CONSTRAINT "letter_task_comment_parent_comment_id_letter_task_comment_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."letter_task_comment"("id") ON DELETE cascade ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_comment_parent_comment_id_letter_task_comment_id_fk';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'letter_task_tag_letter_id_letter_id_fk') THEN
    ALTER TABLE "letter_task_tag" ADD CONSTRAINT "letter_task_tag_letter_id_letter_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letter"("id") ON DELETE cascade ON UPDATE no action;
    RAISE NOTICE 'Added foreign key: letter_task_tag_letter_id_letter_id_fk';
  END IF;
END $$;

-- Add missing indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_letter_id_idx') THEN
    CREATE INDEX "letter_task_letter_id_idx" ON "letter_task"("letter_id");
    RAISE NOTICE 'Added index: letter_task_letter_id_idx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_status_idx') THEN
    CREATE INDEX "letter_task_status_idx" ON "letter_task"("status");
    RAISE NOTICE 'Added index: letter_task_status_idx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_assignment_task_id_idx') THEN
    CREATE INDEX "letter_task_assignment_task_id_idx" ON "letter_task_assignment"("task_id");
    RAISE NOTICE 'Added index: letter_task_assignment_task_id_idx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_assignment_user_id_idx') THEN
    CREATE INDEX "letter_task_assignment_user_id_idx" ON "letter_task_assignment"("user_id");
    RAISE NOTICE 'Added index: letter_task_assignment_user_id_idx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_comment_task_id_idx') THEN
    CREATE INDEX "letter_task_comment_task_id_idx" ON "letter_task_comment"("task_id");
    RAISE NOTICE 'Added index: letter_task_comment_task_id_idx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_tag_letter_id_idx') THEN
    CREATE INDEX "letter_task_tag_letter_id_idx" ON "letter_task_tag"("letter_id");
    RAISE NOTICE 'Added index: letter_task_tag_letter_id_idx';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'letter_task_tag_letter_id_tag_unique') THEN
    CREATE UNIQUE INDEX "letter_task_tag_letter_id_tag_unique" ON "letter_task_tag"("letter_id", "tag");
    RAISE NOTICE 'Added unique index: letter_task_tag_letter_id_tag_unique';
  END IF;
END $$;

