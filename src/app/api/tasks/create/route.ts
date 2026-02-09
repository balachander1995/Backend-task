import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { validateRequest } from "@/server/auth/validateRequest";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  imageUrl: z.string().url().optional().or(z.null()),
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

    const body = schema.parse(await req.json());

    const [created] = await db
      .insert(tasks)
      .values({
        title: body.title,
        description: body.description,
        status: body.status ?? "pending",
        priority: body.priority ?? "medium",
        imageUrl: body.imageUrl,
        userId: user.id,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
