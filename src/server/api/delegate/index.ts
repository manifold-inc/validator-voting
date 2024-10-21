import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { Account } from "~/server/schema/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

export const delegateRouter = createTRPCRouter({
  getAllDelegateWeightsAndStakes: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select()
        .from(Account)
        .orderBy(desc(Account.created_at))
        .execute();

      const formattedData = result.map((item) => ({
        ...item,
        timestamp: new Date(item.created_at),
        weights: item.weights
          ? Object.fromEntries(
              Object.entries(item.weights).map(([key, value]) => [key, value]),
            )
          : {},
        stake: item.stake,
      }));
      return formattedData;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve delegation weights and stakes",
        cause: error,
      });
    }
  }),
  getDelegateStake: publicProcedure
    .input(z.object({ ss58: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select({ stake: Account.stake })
          .from(Account)
          .where(eq(Account.ss58, input.ss58))
          .execute();

        return result[0]?.stake ?? null;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve delegation stake",
          cause: error,
        });
      }
    }),
});
