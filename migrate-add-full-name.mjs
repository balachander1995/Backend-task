import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function addFullNameColumn() {
  try {
    console.log("Starting migration: adding full_name column...");

    // Add full_name column if it doesn't exist
    console.log("Adding full_name column...");
    await db.execute(sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" varchar(255)
    `);
    console.log("✓ Column added or already exists");

    // Update existing users with their username as full_name if null
    console.log("Updating existing users...");
    const result = await db.execute(sql`
      UPDATE "users" SET "full_name" = username WHERE "full_name" IS NULL
    `);
    console.log("✓ Existing users updated");

    console.log("✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addFullNameColumn();
