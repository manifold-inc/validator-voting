import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { userDelegation, genId } from "~/server/schema/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

const logError = (procedureName: string, error: unknown) => {
  console.error(`Error in ${procedureName}:`, error);
  if (error instanceof Error) {
    console.error(`Stack trace: ${error.stack}`);
  }
};

const safeStringify = (obj: unknown): string => {
  return JSON.stringify(
    obj,
    (_, value): string | number | boolean | null =>
      typeof value === "bigint" ? value.toString() : value,
    2,
  );
};

export const delegateRouter = createTRPCRouter({
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
          .from(userDelegation)
          .where(eq(userDelegation.connected_account, input.connected_account))
          .orderBy(desc(userDelegation.created_at))
          .limit(1)
          .execute();

        let result;
        if (latestDelegation.length > 0) {
          // Update existing record
          result = await ctx.db
            .update(userDelegation)
            .set({ weights: weightsRecord })
            .where(
              eq(userDelegation.connected_account, input.connected_account),
            )
            .execute();
          return { success: true, ud_nanoid: latestDelegation[0]!.ud_nanoid };
        } else {
          // Insert new record
          const ud_nanoid = genId.userDelegation();
          result = await ctx.db
            .insert(userDelegation)
            .values({
              ud_nanoid: ud_nanoid,
              connected_account: input.connected_account,
              weights: weightsRecord,
            })
            .execute();
          return { success: true, ud_nanoid };
        }
      } catch (error) {
        logError("addDelegateWeights", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update or insert delegation weights",
          cause: error,
        });
      }
    }),

  addDelegateStake: publicProcedure
    .input(
      z.object({
        connected_account: z.string(),
        stake: z.bigint(),
        txHash: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Insert new record
        const ud_nanoid = genId.userDelegation();
        const result = await ctx.db
          .insert(userDelegation)
          .values({
            ud_nanoid: ud_nanoid,
            connected_account: input.connected_account,
            stake: input.stake,
            txHash: input.txHash,
          })
          .execute();

        return { success: true, ud_nanoid, stake: input.stake.toString() };
      } catch (error) {
        logError("addDelegateStake", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert delegation stake",
          cause: error,
        });
      }
    }),

  getAllDelegateWeightsAndStakes: publicProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select({
          ud_nanoid: userDelegation.ud_nanoid,
          connected_account: userDelegation.connected_account,
          weights: userDelegation.weights,
          stake: userDelegation.stake,
          timestamp: userDelegation.created_at,
        })
        .from(userDelegation)
        .orderBy(desc(userDelegation.created_at))
        .execute();

      return { delegateWeightsAndStakes: result };
    } catch (error) {
      logError("getAllDelegateWeightsAndStakes", error);
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

        return { stake: result[0]?.stake ?? null };
      } catch (error) {
        logError("getDelegateStake", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve delegation stake",
          cause: error,
        });
      }
    }),
});
