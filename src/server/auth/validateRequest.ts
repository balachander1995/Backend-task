import { cookies } from "next/headers";
import { lucia } from "./lucia";

export async function validateRequest() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return { user: null, session: null };

  const result = await lucia.validateSession(sessionId);

  // refresh cookie if needed
  try {
    if (result.session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      cookieStore.set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!result.session) {
      const blankCookie = lucia.createBlankSessionCookie();
      cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
    }
  } catch {
    // ignore cookie errors
  }

  return result;
}
