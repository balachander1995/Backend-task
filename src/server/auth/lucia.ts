import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "@/server/db";
import { sessions, users } from "@/server/db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: "auth_session",
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes: Record<string, unknown>) => {
    return {
      username: attributes.username as string,
      fullName: attributes.fullName as string,
      role: attributes.role as "admin" | "user",
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
      fullName: string;
      role: "admin" | "user";
    };
  }
}
