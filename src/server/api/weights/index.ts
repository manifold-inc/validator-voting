import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq, sql, isNull, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Account, Validator } from "~/server/schema/schema";
import { env } from "~/env.mjs";

export const weightsRouter = createTRPCRouter({
  getSubnetWeights: publicProcedure.query(async ({ ctx }) => {
    try {
      const [[total_voted_stake], [vali], results] = await Promise.all([
        ctx.db
          .select({
            total_stake: sum(Account.stake).mapWith((x) =>
              x ? BigInt(x as string) : 0n,
            ),
          })
          .from(Account),
        ctx.db
          .select({ stake: Validator.stake, weights: Account.weights })
          .from(Validator)
          .leftJoin(Account, eq(Account.ss58, Validator.ss58))
          .where(eq(Validator.ss58, env.NEXT_PUBLIC_VALIDATOR_ADDRESS)),
        await ctx.db.execute(sql`
        SELECT 
          key as subnet,
          SUM(CAST(value AS INT) / 100 * stake) as weight
        FROM account,
          jsonb_each_text(weights::jsonb) as w(key, value)
        GROUP BY key
        ORDER BY key DESC;
            `),
      ]);
      return {
        total_voted_stake: total_voted_stake?.total_stake ?? 0n,
        remaining_stake: vali!.stake - (total_voted_stake?.total_stake ?? 0n),
        owner_votes: vali!.weights,
        votes: results.map((row) => ({
          subnet: String(row.subnet),
          weight: row.weight ? BigInt(row.weight as string) : 0n,
        })),
      };
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
