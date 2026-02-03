import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { validateRequest } from "@/server/auth/validateRequest";
import { eq } from "drizzle-orm";
import { z } from "zod";

const deleteSchema = z.object({
  id: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json() as unknown;
    const { id } = deleteSchema.parse(body);

    // Check if task exists and belongs to user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!existingTask || existingTask.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const task = existingTask[0]!;

    if (task.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await db.delete(tasks).where(eq(tasks.id, id));

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
