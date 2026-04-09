import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const questionRouter = createTRPCRouter({
  getRandom: publicProcedure
    .input(
      z.object({
        subject: z.string(),
        count: z.number().min(1).max(65),
      })
    )
    .query(async ({ ctx, input }) => {
      const questions = await ctx.db.question.findMany({
        where: { subject: input.subject },
      });
      const shuffled = questions.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, input.count);
    }),

  getBySubject: publicProcedure
    .input(z.object({ subject: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.question.findMany({
        where: { subject: input.subject },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.question.findMany();
  }),
});
