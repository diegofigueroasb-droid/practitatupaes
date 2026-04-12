import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const guestUserId = "guest-user";

function getSampleQuestions(subject: string): any[] {
  const allQuestions: Record<string, any[]> = {
    'Comprension Lectora': [
      { subject: 'Comprension Lectora', prompt: '¿Cuál es la idea principal del texto sobre el cambio climático?', alternatives: [{ key: 'A', text: 'El cambio climático solo afecta a los polos' }, { key: 'B', text: 'Las actividades humanas son la causa principal del calentamiento global' }, { key: 'C', text: 'El clima siempre ha cambiado naturalmente' }, { key: 'D', text: 'Los animales son los más afectados' }, { key: 'E', text: 'No hay consenso científico sobre el tema' }], correctAlternative: 'B', explanationsByAlternative: { A: 'Incorrecto. El cambio climático afecta a todo el planeta.', B: 'Correcto. Las emisiones de gases de efecto invernadero son la causa principal.', C: 'Incorrecto. La rapidez actual es antropogénica.', D: 'Incorrecto. El impacto es global.', E: 'Incorrecto. Hay amplio consenso científico.' } },
    ],
    'Matematica M1': [
      { subject: 'Matematica M1', prompt: 'Si 3x + 7 = 22, ¿cuál es el valor de x?', alternatives: [{ key: 'A', text: '3' }, { key: 'B', text: '5' }, { key: 'C', text: '7' }, { key: 'D', text: '15' }, { key: 'E', text: '29' }], correctAlternative: 'B', explanationsByAlternative: { A: 'Incorrecto. 3(3) + 7 = 16 ≠ 22', B: 'Correcto. 3(5) + 7 = 15 + 7 = 22', C: 'Incorrecto. 3(7) + 7 = 28 ≠ 22', D: 'Incorrecto. 3(15) + 7 = 52 ≠ 22', E: 'Incorrecto. 3(29) + 7 = 94 ≠ 22' } },
      { subject: 'Matematica M1', prompt: '¿Cuánto es 15 + 28?', alternatives: [{ key: 'A', text: '43' }, { key: 'B', text: '41' }, { key: 'C', text: '42' }, { key: 'D', text: '44' }, { key: 'E', text: '40' }], correctAlternative: 'A', explanationsByAlternative: { A: 'Correcto.', B: 'Incorrecto.', C: 'Incorrecto.', D: 'Incorrecto.', E: 'Incorrecto.' } },
    ],
    'Matematica M2': [
      { subject: 'Matematica M2', prompt: '¿Cuál es el valor de log₂(8)?', alternatives: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }, { key: 'C', text: '3' }, { key: 'D', text: '8' }, { key: 'E', text: '16' }], correctAlternative: 'C', explanationsByAlternative: { A: 'Incorrecto. log₂(2) = 1', B: 'Incorrecto. log₂(4) = 2', C: 'Correcto. 2³ = 8', D: 'Incorrecto. log₂(8) = 3, no 8', E: 'Incorrecto. log₂(16) = 4' } },
    ],
    'Historia': [
      { subject: 'Historia', prompt: '¿En qué año ocurrió el golpe de Estado en Chile?', alternatives: [{ key: 'A', text: '1970' }, { key: 'B', text: '1971' }, { key: 'C', text: '1972' }, { key: 'D', text: '1973' }, { key: 'E', text: '1974' }], correctAlternative: 'D', explanationsByAlternative: { A: 'Incorrecto. 1970 fue la elección de Allende.', B: 'Incorrecto.', C: 'Incorrecto.', D: 'Correcto. El golpe fue el 11 de septiembre de 1973.', E: 'Incorrecto.' } },
    ],
    'Ciencias': [
      { subject: 'Ciencias', prompt: '¿Cuál es la fórmula química del agua?', alternatives: [{ key: 'A', text: 'CO₂' }, { key: 'B', text: 'H₂O' }, { key: 'C', text: 'NaCl' }, { key: 'D', text: 'O₂' }, { key: 'E', text: 'H₂' }], correctAlternative: 'B', explanationsByAlternative: { A: 'Incorrecto. CO₂ es dióxido de carbono.', B: 'Correcto. H₂O es la fórmula del agua.', C: 'Incorrecto. NaCl es cloruro de sodio (sal).', D: 'Incorrecto. O₂ es oxígeno molecular.', E: 'Incorrecto. H₂ es hidrógeno molecular.' } },
    ],
  };
  return allQuestions[subject] || [];
}

export const sessionRouter = createTRPCRouter({
  create: publicProcedure
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
            userId: guestUserId,
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
        let dbQuestions = await ctx.db.question.findMany({
          where: { subject },
          take: questionCount,
          orderBy: { createdAt: "asc" },
        });

        if (dbQuestions.length === 0) {
          const sampleQuestions = getSampleQuestions(subject);
          for (const q of sampleQuestions) {
            await ctx.db.question.create({ data: q });
          }
          dbQuestions = await ctx.db.question.findMany({
            where: { subject },
            take: questionCount,
          });
        }

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
          userId: guestUserId,
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

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.session.findFirst({
        where: { id: input.id, userId: guestUserId },
      });
    }),

  getRecent: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.session.findMany({
        where: { userId: guestUserId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  complete: publicProcedure
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
        where: { id: input.id, userId: guestUserId },
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
                  userId: guestUserId,
                  questionHash: answer.questionId,
                },
              },
              create: {
                userId: guestUserId,
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
              userId: guestUserId,
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
