import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
import { validateRequest } from "@/server/auth/validateRequest";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.enum(["pending", "in-progress", "completed"]).nullable().default(null),
  priority: z.enum(["low", "medium", "high"]).nullable().default(null),
});

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;

    // Parse with defaults when values are null
    const params = schema.parse({
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "10",
      status: searchParams.get("status") ?? null,
      priority: searchParams.get("priority") ?? null,
    });

    const whereConditions: Array<ReturnType<typeof eq>> = [];

    if (user.role !== "admin") {
      whereConditions.push(eq(tasks.userId, user.id));
    }

    if (params.status !== null) {
      whereConditions.push(eq(tasks.status, params.status));
    }

    if (params.priority !== null) {
      whereConditions.push(eq(tasks.priority, params.priority));
    }

    const allTasks = whereConditions.length > 0
      ? await db.select().from(tasks).where(and(...whereConditions))
      : await db.select().from(tasks);

    const totalCount = allTasks.length;
    const totalPages = Math.ceil(totalCount / params.limit);
    const offset = (params.page - 1) * params.limit;
    const paginatedTasks = allTasks.slice(offset, offset + params.limit);

    return NextResponse.json({
      data: paginatedTasks,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.errors);
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
