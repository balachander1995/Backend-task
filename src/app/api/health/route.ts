import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    // Test database connection
    const result = await db.query.users.findFirst();
    return NextResponse.json({
      status: "ok",
      message: "Database connected",
      firstUser: result ? result.username : "No users",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Health check error:", err);
    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: 500 }
    );
  }
}
