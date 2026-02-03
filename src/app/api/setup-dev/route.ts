import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { hash } from "@node-rs/argon2";

export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // Check if dev user already exists
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, "devuser"),
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Dev user already exists",
        user: {
          id: existingUser.id,
          username: existingUser.username,
          role: existingUser.role,
        },
      });
    }

    // Create password hash
    const passwordHash = await hash("devpass123");

    // Insert dev user
    const insertData = {
      username: "devuser" as const,
      fullName: "Dev User" as const,
      passwordHash,
      role: "user" as const,
    };
    const result = await db
      .insert(users)
      .values(insertData)
      .returning();

    if (!result[0]) {
      return NextResponse.json(
        { error: "Failed to create dev user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dev user created successfully",
      user: {
        id: result[0].id,
        username: result[0].username,
        role: result[0].role,
      },
    });
  } catch (error) {
    console.error("Error creating dev user:", error);
    return NextResponse.json(
      { error: "Failed to create dev user", details: String(error) },
      { status: 500 }
    );
  }
}
