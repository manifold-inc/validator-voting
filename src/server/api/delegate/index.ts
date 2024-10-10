import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { userDelegation, userWeights } from "~/server/schema/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";

export const delegateRouter = createTRPCRouter({
  getAllDelegateWeightsAndStakes: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select({
          ud_nanoid: userDelegation.ud_nanoid,
          connected_account: userDelegation.connected_account,
          weights: userWeights.weights,
          stake: userDelegation.stake,
          timestamp: userDelegation.created_at,
        })
        .from(userDelegation)
        .leftJoin(
          userWeights,
          eq(userDelegation.connected_account, userWeights.connected_account),
        )
        .orderBy(desc(userDelegation.created_at))
        .execute();

      const formattedData = result.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp!),
        weights: item.weights
          ? Object.fromEntries(
              Object.entries(item.weights).map(([key, value]) => [key, value]),
            )
          : {},
        stake: item.stake,
        ud_nanoid: item.ud_nanoid,
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
    .input(z.object({ connected_account: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.connected_account) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account must be provided",
        });
      }

      try {
        const result = await ctx.db
          .select({ stake: userDelegation.stake })
          .from(userDelegation)
          .where(eq(userDelegation.connected_account, input.connected_account))
          .orderBy(desc(userDelegation.created_at))
          .limit(1)
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
  getSubnetWeights: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db.execute(sql`
          WITH latest_delegations AS (
            SELECT DISTINCT ON (connected_account)
              weights,
              stake
            FROM user_delegation
            WHERE weights IS NOT NULL AND stake IS NOT NULL
            ORDER BY connected_account, created_at DESC
          )
          SELECT 
            key as subnet,
            SUM(CAST(value AS FLOAT) * stake) / SUM(stake) as weight
          FROM latest_delegations,


            json_each_text(weights::json) as w(key, value)
          GROUP BY key
          ORDER BY weight DESC;
        `);

      return result.map((row) => ({
        subnet: String(row.subnet),
        weight: Number(row.weight),
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve subnet weights",
        cause: error,
      });
    }
  }),
});
