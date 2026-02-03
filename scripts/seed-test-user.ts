import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { hash } from "@node-rs/argon2";

async function seedTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, "testuser"),
    });

    if (existingUser) {
      console.log("Test user already exists");
      return;
    }

    // Create password hash for 'password123'
    const passwordHash = await hash("password123");

    // Insert test user
    const result = await db.insert(users).values({
      username: "testuser",
      fullName: "Test User",
      passwordHash,
      role: "user",
    } as any).returning();

    console.log("Test user created successfully:", result[0]);
  } catch (error) {
    console.error("Error seeding test user:", error);
    process.exit(1);
  }
}

seedTestUser().then(() => {
  console.log("Seeding complete");
  process.exit(0);
});
