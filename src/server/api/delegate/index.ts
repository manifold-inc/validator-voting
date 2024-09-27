import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { userDelegation, genId } from "~/server/schema/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

const logError = (procedureName: string, error: unknown) => {
  console.error(`Error in ${procedureName}:`, error);
  if (error instanceof Error) {
    console.error(`Stack trace: ${error.stack}`);
  }
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
      console.log(
        `[addDelegateWeights] Input:`,
        JSON.stringify(input, null, 2),
      );
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

        console.log("Attempting to update or insert weights:", input);
        const weightsRecord = Object.fromEntries(
          input.weights.map(({ subnet, weight }) => [subnet, weight]),
        );

        // Check if the connected account exists
        const existingDelegation = await ctx.db
          .select()
          .from(userDelegation)
          .where(eq(userDelegation.connected_account, input.connected_account))
          .limit(1)
          .execute();

        let result;
        if (existingDelegation.length > 0) {
          // Update existing record
          result = await ctx.db
            .update(userDelegation)
            .set({ weights: weightsRecord, updated_at: new Date() })
            .where(
              eq(userDelegation.connected_account, input.connected_account),
            )
            .execute();
          console.log(
            `[addDelegateWeights] Operation successful. Result:`,
            JSON.stringify(result, null, 2),
          );
          return { success: true, ud_nanoid: existingDelegation[0]!.ud_nanoid };
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
          console.log(
            `[addDelegateWeights] Operation successful. Result:`,
            JSON.stringify(result, null, 2),
          );
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
        removeStake: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(`[addDelegateStake] Input:`, JSON.stringify(input, null, 2));
      try {
        console.log("Attempting to update or insert stake:", input);

        // Check if the connected account exists
        const existingDelegation = await ctx.db
          .select()
          .from(userDelegation)
          .where(eq(userDelegation.connected_account, input.connected_account))
          .limit(1)
          .execute();

        let result;
        if (existingDelegation.length > 0) {
          if (Number(existingDelegation[0]!.stake) - Number(input.stake) < 0) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Insufficient stake to remove",
            });
          }
          if (Number(existingDelegation[0]!.stake) - Number(input.stake) < 0) {
            // Delete the record if the resulting stake is zero
            result = await ctx.db
              .delete(userDelegation)
              .where(
                eq(userDelegation.connected_account, input.connected_account),
              )
              .execute();
            console.log(
              `[addDelegateStake] Operation successful. Result:`,
              JSON.stringify(result, null, 2),
            );
            return { success: true };
          } else {
            // Update existing record
            result = await ctx.db
              .update(userDelegation)
              .set({
                stake: existingDelegation[0]!.stake! - input.stake,
                updated_at: new Date(),
              })
              .where(
                eq(userDelegation.connected_account, input.connected_account),
              )
              .execute();
            console.log(
              `[addDelegateStake] Operation successful. Result:`,
              JSON.stringify(result, null, 2),
            );
            return {
              success: true,
              ud_nanoid: existingDelegation[0]!.ud_nanoid,
            };
          }
        } else {
          if (input.removeStake) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Cannot remove stake from non-existent account",
            });
          }
          // Insert new record
          const ud_nanoid = genId.userDelegation();
          result = await ctx.db
            .insert(userDelegation)
            .values({
              ud_nanoid: ud_nanoid,
              connected_account: input.connected_account,
              stake: input.stake,
            })
            .execute();
          console.log(
            `[addDelegateStake] Operation successful. Result:`,
            JSON.stringify(result, null, 2),
          );
          return { success: true, ud_nanoid };
        }
      } catch (error) {
        logError("addDelegateStake", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update or insert delegation stake",
          cause: error,
        });
      }
    }),

  getAllDelegateWeightsAndStakes: publicProcedure.query(async ({ ctx }) => {
    console.log(
      `[getAllDelegateWeightsAndStakes] Fetching all delegate weights and stakes`,
    );
    try {
      const result = await ctx.db
        .select({
          connected_account: userDelegation.connected_account,
          weights: userDelegation.weights,
          stake: userDelegation.stake,
          timestamp: userDelegation.updated_at,
        })
        .from(userDelegation)
        .execute();

      console.log(
        `[getAllDelegateWeightsAndStakes] Fetched ${result.length} records`,
      );
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
      console.log(`[getDelegateStake] Input:`, JSON.stringify(input, null, 2));
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
          .execute();

        console.log(
          `[getDelegateStake] Stake retrieved:`,
          result[0]?.stake ?? null,
        );
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
