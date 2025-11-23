import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { todoRouter } from "./todo";
import { letterRouter } from "./letter";
import { uploadRouter } from "./upload";
import { letterTaskRouter } from "./letter-task";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	todo: todoRouter,
	letter: letterRouter,
	upload: uploadRouter,
	letterTask: letterTaskRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
