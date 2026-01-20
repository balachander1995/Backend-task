import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tasks } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const taskRouter = createTRPCRouter({
  getTasks: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(tasks);
  }),

  createTask: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(["pending", "in-progress", "completed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(tasks).values(input);
    }),

  updateTask: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, string> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status !== undefined) updates.status = input.status;

      return await ctx.db
        .update(tasks)
        .set(updates)
        .where(eq(tasks.id, input.id));
    }),

  deleteTask: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(tasks).where(eq(tasks.id, input.id));
    }),
});
