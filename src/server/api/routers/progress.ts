import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const progressRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.session.findMany({
      where: { userId: ctx.auth.userId },
      orderBy: { createdAt: "desc" },
    });

    const totalSessions = sessions.length;
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionCount, 0);
    const averageScore =
      totalSessions > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + s.estimatedScore, 0) /
              totalSessions
          )
        : 0;

    const bySubject = await ctx.db.session.groupBy({
      by: ["subject"],
      where: { userId: ctx.auth.userId },
      _count: true,
      _avg: { estimatedScore: true },
    });

    return {
      totalSessions,
      totalCorrect,
      totalQuestions,
      averageScore,
      bySubject: bySubject.map((s) => ({
        subject: s.subject,
        count: s._count,
        avgScore: Math.round(s._avg.estimatedScore ?? 0),
      })),
    };
  }),

  getTrend: protectedProcedure
    .input(
      z.object({
        subject: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.session.findMany({
        where: {
          userId: ctx.auth.userId,
          ...(input.subject && { subject: input.subject }),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
      return sessions.map((s) => ({
        date: s.createdAt,
        score: s.estimatedScore,
        subject: s.subject,
        correctCount: s.correctCount,
        totalCount: s.questionCount,
      }));
    }),
});
