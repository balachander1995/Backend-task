import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { lucia } from "@/server/auth/lucia";
import { cookies } from "next/headers";
import { z } from "zod";
import { hash } from "@node-rs/argon2";

const schema = z.object({
  username: z.string().min(3).max(255),
  fullName: z.string().min(1).max(255).optional(),
  password: z.string().min(6).max(255),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, body.username),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(body.password);

    const [user] = await db
      .insert(users)
      .values({
        username: body.username,
        fullName: body.fullName ?? body.username,
        passwordHash,
        role: "user",
      })
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    const cookieStore = await cookies();
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return NextResponse.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (err) {
    console.error("Signup error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
