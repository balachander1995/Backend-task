import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { validateRequest } from "@/server/auth/validateRequest";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Only admin can view other users' tasks
    if (user.role !== "admin" && user.id !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get user's tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));

    return NextResponse.json(
      { data: userTasks },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
