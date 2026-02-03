import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { validateRequest } from "@/server/auth/validateRequest";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

// POST - Create a task for a specific user (admin only)
export async function POST(
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

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = schema.parse(await req.json());

    // Create task for the user
    const [newTask] = await db
      .insert(tasks)
      .values({
        title: body.title,
        description: body.description ?? null,
        status: body.status,
        priority: body.priority,
        userId,
      })
      .returning();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a task for a user (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; taskId: string }> }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId, taskId } = await params;
    const body = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["pending", "in-progress", "completed"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    }).parse(await req.json());

    // Verify task belongs to user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!existingTask || existingTask.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (existingTask[0]!.userId !== userId) {
      return NextResponse.json(
        { error: "Task does not belong to this user" },
        { status: 400 }
      );
    }

    // Update task
    const [updated] = await db
      .update(tasks)
      .set({
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
