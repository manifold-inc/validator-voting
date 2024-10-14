import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq, sql, isNull, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Account } from "~/server/schema/schema";

export const weightsRouter = createTRPCRouter({
  getSubnetWeights: publicProcedure.query(async ({ ctx }) => {
    try {
      const [[total_stake], results] = await Promise.all([
        ctx.db
          .select({ total_stake: sum(Account.stake).mapWith(Number) })
          .from(Account),
        await ctx.db.execute(sql`
        SELECT 
          key as subnet,
          SUM(CAST(value AS FLOAT) / 100 * stake) as weight
        FROM account,
          jsonb_each_text(weights::jsonb) as w(key, value)
        GROUP BY key
        ORDER BY key DESC;
            `),
      ]);
      return results.map((row) => ({
        subnet: String(row.subnet),
        weight: (Number(row.weight) / (total_stake?.total_stake ?? 1)) * 100,
      }));
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve subnet weights",
        cause: error,
      });
    }
  }),
  getStakeNoWeights: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select({
          totalStake: sql<bigint>`sum(${Account.stake})`,
        })
        .from(Account)
        .where(isNull(Account.stake));

      return result[0]?.totalStake ?? 0n;
    } catch {
      throw new Error("Failed to fetch stake with no weights");
    }
  }),
  getDelegateSubnetWeights: publicProcedure
    .input(
      z.object({
        ss58: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select({ weights: Account.weights })
          .from(Account)
          .where(eq(Account.ss58, input.ss58));

        if (result.length === 0) {
          return [];
        }

        const weightsObject = result[0]?.weights ?? {};
        const separatedWeights = Object.entries(weightsObject).map(
          ([subnet, weight]) => ({
            subnet,
            weight: Number(weight),
          }),
        );
        return separatedWeights;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve delegate subnet weights",
          cause: error,
        });
      }
    }),
  addDelegateWeights: publicProcedure
    .input(
      z.object({
        ss58: z.string(),
        weights: z.array(z.object({ subnet: z.string(), weight: z.number() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const totalWeight = input.weights.reduce(
          (sum, weight) => sum + weight.weight,
          0,
        );
        if (totalWeight !== 100) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Total weight must be 100",
          });
        }

        const weightsRecord = Object.fromEntries(
          input.weights.map(({ subnet, weight }) => [subnet, weight]),
        );

        // Check if the connected account exists
        const latestDelegation = await ctx.db
          .select()
          .from(Account)
          .where(eq(Account.ss58, input.ss58))
          .limit(1)
          .execute();

        if (latestDelegation.length > 0) {
          // Update existing record
          await ctx.db
            .update(Account)
            .set({ weights: weightsRecord })
            .where(eq(Account.ss58, input.ss58))
            .execute();
          return { success: true };
        } else {
          // Insert new record
          await ctx.db
            .insert(Account)
            .values({
              ss58: input.ss58,
              weights: weightsRecord,
            })
            .execute();
          return { success: true };
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update or insert delegation weights",
          cause: error,
        });
      }
    }),
});
