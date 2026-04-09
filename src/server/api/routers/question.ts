import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

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
      const shuffled = shuffleArray(questions);
      return shuffled.slice(0, input.count);
    }),

  getBySubject: publicProcedure
    .input(z.object({ subject: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.question.findMany({
        where: { subject: input.subject },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.question.findMany();
  }),
});
