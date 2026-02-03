import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { lucia } from "@/server/auth/lucia";
import { cookies } from "next/headers";
import { z } from "zod";
import { verify } from "@node-rs/argon2";

const schema = z.object({
  username: z.string().min(3).max(255),
  password: z.string().min(6).max(255),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, body.username),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const ok = await verify(user.passwordHash, body.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
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
    console.error("Login error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
