import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const errorRouter = createTRPCRouter({
  getPending: protectedProcedure
    .input(z.object({ subject: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.pendingError.findMany({
        where: {
          userId: ctx.auth.userId,
          resolved: false,
          ...(input.subject && {
            question: { path: ["subject"], equals: input.subject },
          }),
        },
        orderBy: { lastSeenAt: "desc" },
      });
    }),

  resolve: protectedProcedure
    .input(z.object({ questionHash: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pendingError.updateMany({
        where: { userId: ctx.auth.userId, questionHash: input.questionHash },
        data: { resolved: true },
      });
    }),
});
