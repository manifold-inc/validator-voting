import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { userDelegation, genId } from "~/server/schema/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

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
        console.log("Attempting to update or insert weights:", input);
        const totalWeight = input.weights.reduce(
          (sum, weight) => sum + weight.weight,
          0,
        );
        if (totalWeight !== 100) {
          throw new TRPCError({
            message: "Total weight must be 100",
            code: "BAD_REQUEST",
          });
        }

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
          console.log("Update operation result:", result);
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
          console.log("Insert operation result:", result);
          return { success: true, ud_nanoid };
        }
      } catch (error) {
        console.error("Error in addDelegateWeights:", error);
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
        stake: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
          // Update existing record
          result = await ctx.db
            .update(userDelegation)
            .set({ stake: input.stake, updated_at: new Date() })
            .where(
              eq(userDelegation.connected_account, input.connected_account),
            )
            .execute();
          console.log("Update operation result:", result);
          return { success: true, ud_nanoid: existingDelegation[0]!.ud_nanoid };
        } else {
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
          console.log("Insert operation result:", result);
          return { success: true, ud_nanoid };
        }
      } catch (error) {
        console.error("Error in addDelegateStake:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update or insert delegation stake",
          cause: error,
        });
      }
    }),

  getAllDelegateWeightsAndStakes: publicProcedure.query(async ({ ctx }) => {
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

      return { delegateWeightsAndStakes: result };
    } catch (error) {
      console.error("Error in getAllDelegateWeightsAndStakes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve delegation weights and stakes",
        cause: error,
      });
    }
  }),
});
