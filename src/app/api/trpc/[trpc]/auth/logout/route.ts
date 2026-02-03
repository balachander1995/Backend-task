import { NextResponse } from "next/server";
import { validateRequest } from "@/server/auth/validateRequest";
import { lucia } from "@/server/auth/lucia";
import { cookies } from "next/headers";

export async function POST() {
  const { session } = await validateRequest();

  if (session) {
    await lucia.invalidateSession(session.id);
  }

  const blankCookie = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

  return NextResponse.json({ success: true });
}
