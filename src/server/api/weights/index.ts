import { createTRPCRouter, publicProcedure } from "../trpc";
import { eq, sql, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { genId, userDelegation, userWeights } from "~/server/schema/schema";

export const weightsRouter = createTRPCRouter({
  getSubnetWeights: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db.execute(sql`
        WITH latest_delegations AS (
          SELECT DISTINCT ON (ud.connected_account)
            uw.weights,
            ud.stake
          FROM user_delegation ud
          JOIN user_weights uw ON ud.connected_account = uw.connected_account
          WHERE uw.weights IS NOT NULL AND ud.stake IS NOT NULL
          ORDER BY ud.connected_account, ud.created_at DESC
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
  getStakeNoWeights: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select({
          totalStake: sql<bigint>`sum(${userDelegation.stake})`,
        })
        .from(userDelegation)
        .leftJoin(
          userWeights,
          eq(userDelegation.connected_account, userWeights.connected_account)
        )
        .where(isNull(userWeights.uw_nanoid));

      return result[0]?.totalStake ?? 0n;
    } catch (error) {
      console.error("Error fetching stake with no weights:", error);
      throw new Error("Failed to fetch stake with no weights");
    }
  }),
  getDelegateSubnetWeights: publicProcedure
    .input(
      z.object({
        connected_account: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select({ weights: userWeights.weights })
          .from(userWeights)
          .where(eq(userWeights.connected_account, input.connected_account));

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account has no weights created",
          });
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
        connected_account: z.string(),
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
          .from(userWeights)
          .where(eq(userWeights.connected_account, input.connected_account))
          .limit(1)
          .execute();

        if (latestDelegation.length > 0) {
          // Update existing record
          await ctx.db
            .update(userWeights)
            .set({ weights: weightsRecord })
            .where(eq(userWeights.connected_account, input.connected_account))
            .execute();
          return { success: true };
        } else {
          // Insert new record
          const uw_nanoid = genId.userWeights();
          await ctx.db
            .insert(userWeights)
            .values({
              uw_nanoid: uw_nanoid,
              connected_account: input.connected_account,
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
