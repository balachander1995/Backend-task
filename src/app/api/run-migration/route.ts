import { sql } from "drizzle-orm";
import { db } from "@/server/db";

interface PostgresError extends Error {
  code?: string;
  message: string;
}

export async function POST() {
  try {
    console.log("Executing migration to add full_name column...");
    
    // First, add the column with a default value
    try {
      await db.execute(
        sql`ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NOT NULL DEFAULT 'User'`
      );
      console.log("✓ Column added successfully");
    } catch (error) {
      const err = error as PostgresError;
      if (err.code === '42701') {
        // Column already exists
        console.log("✓ Column already exists");
      } else {
        throw error;
      }
    }
    
    // Then drop the default for any new inserts
    try {
      await db.execute(
        sql`ALTER TABLE users ALTER COLUMN full_name DROP DEFAULT`
      );
      console.log("✓ Default removed");
    } catch {
      console.log("Could not drop default, continuing...");
    }
    
    return Response.json({ 
      success: true, 
      message: "Migration completed successfully" 
    }, { status: 200 });
  } catch (error) {
    const err = error as PostgresError;
    console.error("Migration error:", error);
    return Response.json(
      { 
        error: "Migration failed", 
        details: err.message ?? String(error),
        code: err.code 
      },
      { status: 500 }
    );
  }
}
