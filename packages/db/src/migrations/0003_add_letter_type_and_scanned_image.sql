ALTER TABLE "letter"
ADD COLUMN IF NOT EXISTS "letter_type" text DEFAULT 'text' NOT NULL;

ALTER TABLE "letter"
ADD COLUMN IF NOT EXISTS "scanned_image_url" text;

