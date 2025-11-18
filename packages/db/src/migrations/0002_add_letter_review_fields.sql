ALTER TABLE "letter"
ADD COLUMN IF NOT EXISTS "rejected_by" text REFERENCES "public"."user"("id");

ALTER TABLE "letter"
ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;

