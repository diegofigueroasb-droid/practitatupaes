import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const sessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        subject: z.string(),
        mode: z.enum(["Ensayo oficial", "Repaso errores"]),
        questionCount: z.number().min(1).max(65),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { subject, mode, questionCount } = input;

      let questions;

      if (mode === "Repaso errores") {
        const errors = await ctx.db.pendingError.findMany({
          where: {
            userId: ctx.auth.userId,
            resolved: false,
            question: { path: ["subject"], equals: subject },
          },
          take: questionCount,
        });
        if (errors.length === 0) {
          throw new Error(`No tienes errores pendientes para ${subject}`);
        }
        questions = errors.map((e) => ({
          ...(e.question as object),
          modeSource: mode,
        }));
      } else {
        const dbQuestions = await ctx.db.question.findMany({
          where: { subject },
          take: questionCount,
          orderBy: { createdAt: "asc" },
        });
        questions = dbQuestions
          .sort(() => Math.random() - 0.5)
          .map((q) => ({
            id: q.id,
            subject: q.subject,
            prompt: q.prompt,
            alternatives: q.alternatives,
            correctAlternative: q.correctAlternative,
            explanationsByAlternative: q.explanationsByAlternative,
            modeSource: mode,
          }));
      }

      return ctx.db.session.create({
        data: {
          userId: ctx.auth.userId,
          subject,
          mode,
          questionCount: questions.length,
          correctCount: 0,
          incorrectCount: 0,
          estimatedScore: 0,
          answers: [],
          questions,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.session.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.session.findMany({
        where: { userId: ctx.auth.userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  complete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            selectedAlternative: z.string(),
            isCorrect: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.session.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!session) throw new Error("Sesión no encontrada");

      const correctCount = input.answers.filter((a) => a.isCorrect).length;
      const incorrectCount = input.answers.length - correctCount;
      const percentage = (correctCount / input.answers.length) * 100;
      const estimatedScore = Math.round(150 + (percentage / 100) * 700);

      for (const answer of input.answers) {
        if (!answer.isCorrect) {
          const question = (session.questions as object[]).find(
            (q: any) => q.id === answer.questionId
          );
          if (question) {
            await ctx.db.pendingError.upsert({
              where: {
                userId_questionHash: {
                  userId: ctx.auth.userId,
                  questionHash: answer.questionId,
                },
              },
              create: {
                userId: ctx.auth.userId,
                questionHash: answer.questionId,
                question: question,
                selectedAlternative: answer.selectedAlternative,
                correctAlternative: (question as any).correctAlternative,
                reviewCount: 1,
                resolved: false,
              },
              update: {
                selectedAlternative: answer.selectedAlternative,
                reviewCount: { increment: 1 },
                resolved: false,
                lastSeenAt: new Date(),
              },
            });
          }
        } else {
          await ctx.db.pendingError.updateMany({
            where: {
              userId: ctx.auth.userId,
              questionHash: answer.questionId,
              resolved: false,
            },
            data: { resolved: true },
          });
        }
      }

      return ctx.db.session.update({
        where: { id: input.id },
        data: {
          correctCount,
          incorrectCount,
          estimatedScore,
          answers: input.answers,
        },
      });
    }),
});
