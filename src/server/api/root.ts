import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { sessionRouter } from "~/server/api/routers/session";
import { questionRouter } from "~/server/api/routers/question";
import { errorRouter } from "~/server/api/routers/error";
import { progressRouter } from "~/server/api/routers/progress";

export const appRouter = createTRPCRouter({
  session: sessionRouter,
  question: questionRouter,
  error: errorRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
