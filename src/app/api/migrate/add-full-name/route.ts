import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";

export async function POST(_req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // Add full_name column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" varchar(255)
    `);

    // Update existing users with their username as full_name if null
    await db.execute(sql`
      UPDATE "users" SET "full_name" = username WHERE "full_name" IS NULL
    `);

    // Make the column NOT NULL (if needed)
    await db.execute(sql`
      ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL
    `);

    return NextResponse.json(
      { success: true, message: "Migration completed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
