// // Example model schema from the Drizzle docs
// // https://orm.drizzle.team/docs/sql-schema-declaration

// import { index, pgTableCreator } from "drizzle-orm/pg-core";

// /**
//  * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
//  * database instance for multiple projects.
//  *
//  * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
//  */
// export const createTable = pgTableCreator((name) => `backendtask_${name}`);

// export const posts = createTable(
//   "post",
//   (d) => ({
//     id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
//     name: d.varchar({ length: 256 }),
//     createdAt: d
//       .timestamp({ withTimezone: true })
//       .$defaultFn(() => /* @__PURE__ */ new Date())
//       .notNull(),
//     updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
//   }),
//   (t) => [index("name_idx").on(t.name)],
// );

// import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";

// export const taskStatusEnum = pgEnum("task_status", [
//   "pending",
//   "in-progress",
//   "completed",
// ]);

// export const tasks = pgTable("tasks", {
//   id: uuid("id").defaultRandom().primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   description: varchar("description", { length: 1000 }),
//   status: taskStatusEnum("status").default("pending"),
//   createdAt: timestamp("created_at").defaultNow(),
// });


import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  index,
} from "drizzle-orm/pg-core";

/** TASK STATUS */
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in-progress",
  "completed",
]);

/** TASK PRIORITY */
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

/** USER ROLE */
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

/** USERS */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),

  role: userRoleEnum("role").notNull().default("user"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** SESSIONS (Lucia) */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

/** TASKS */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),

    status: taskStatusEnum("status").notNull().default("pending"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),

    // Image URL for task
    imageUrl: varchar("image_url", { length: 2048 }),

    // Ownership
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("tasks_user_id_idx").on(table.userId),
    statusIdx: index("tasks_status_idx").on(table.status),
    priorityIdx: index("tasks_priority_idx").on(table.priority),
  }),
);

