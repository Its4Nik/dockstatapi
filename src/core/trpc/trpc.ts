import { initTRPC } from "@trpc/server";

export const t = initTRPC.create();
export const { router } = t;
export const publicProcedure = t.procedure;
