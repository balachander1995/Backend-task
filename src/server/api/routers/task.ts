// import { z } from "zod";
// import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
// import { tasks } from "@/server/db/schema";
// import { eq } from "drizzle-orm";

// export const taskRouter = createTRPCRouter({
//   getTasks: publicProcedure.query(async ({ ctx }) => {
//     return await ctx.db.select().from(tasks);
//   }),

//   createTask: publicProcedure
//     .input(
//       z.object({
//         title: z.string(),
//         description: z.string().optional(),
//         status: z.enum(["pending", "in-progress", "completed"]),
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       return await ctx.db.insert(tasks).values(input);
//     }),

//   updateTask: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         title: z.string().optional(),
//         description: z.string().optional(),
//         status: z.enum(["pending", "in-progress", "completed"]).optional(),
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       const updates: Record<string, string> = {};
//       if (input.title !== undefined) updates.title = input.title;
//       if (input.description !== undefined) updates.description = input.description;
//       if (input.status !== undefined) updates.status = input.status;

//       return await ctx.db
//         .update(tasks)
//         .set(updates)
//         .where(eq(tasks.id, input.id));
//     }),

//   deleteTask: publicProcedure
//     .input(z.object({ id: z.string() }))
//     .mutation(async ({ ctx, input }) => {
//       return await ctx.db.delete(tasks).where(eq(tasks.id, input.id));
//     }),
// });

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { tasks } from "@/server/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export const taskRouter = createTRPCRouter({
  // ✅ GET TASKS (pagination + filters + RBAC)
  getTasks: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),

        // date range filtering (createdAt)
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),

        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user; // always exists due to protectedProcedure

      const whereConditions = [];

      // RBAC: users only see their tasks
      if (user.role !== "admin") {
        whereConditions.push(eq(tasks.userId, user.id));
      }

      if (input.status) whereConditions.push(eq(tasks.status, input.status));
      if (input.priority)
        whereConditions.push(eq(tasks.priority, input.priority));

      if (input.from) whereConditions.push(gte(tasks.createdAt, new Date(input.from)));
      if (input.to) whereConditions.push(lte(tasks.createdAt, new Date(input.to)));

      const where =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const offset = (input.page - 1) * input.limit;

      const data = await ctx.db
        .select()
        .from(tasks)
        .where(where)
        .orderBy(desc(tasks.createdAt))
        .limit(input.limit)
        .offset(offset);

      // For pagination totals (simple approach)
      const allMatching = await ctx.db.select().from(tasks).where(where);

      return {
        data,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: allMatching.length,
          totalPages: Math.ceil(allMatching.length / input.limit),
        },
      };
    }),

  // ✅ CREATE TASK (always owned by logged-in user)
  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      const [created] = await ctx.db
        .insert(tasks)
        .values({
          title: input.title,
          description: input.description,
          status: input.status ?? "pending",
          priority: input.priority ?? "medium",
          userId: user.id,
        })
        .returning();

      return created;
    }),

  // ✅ UPDATE TASK (admin can update all, user only own)
  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      const task = await ctx.db.query.tasks.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      // ownership check
      if (user.role !== "admin" && task.userId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(tasks)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
        })
        .where(eq(tasks.id, input.id))
        .returning();

      return updated;
    }),

  // ✅ DELETE TASK (admin can delete all, user only own)
  deleteTask: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      const task = await ctx.db.query.tasks.findFirst({
        where: (t, { eq }) => eq(t.id, input.id),
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (user.role !== "admin" && task.userId !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(tasks).where(eq(tasks.id, input.id));

      return { success: true };
    }),
});
