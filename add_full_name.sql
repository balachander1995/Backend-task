-- Add full_name column to users table
ALTER TABLE "users" ADD COLUMN "full_name" varchar(255);

-- Update existing users with a default full name
UPDATE "users" SET "full_name" = username WHERE "full_name" IS NULL;

-- Make the column NOT NULL
ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL;
