import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { userDelegation, genId } from "~/server/schema/schema";
import { TRPCError } from "@trpc/server";

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
        console.log("Attempting to insert weights:", input);
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

        const ud_nanoid = genId.userDelegation();

        // Convert array of objects to Record<string, number>
        const weightsRecord = Object.fromEntries(
          input.weights.map(({ subnet, weight }) => [subnet, weight]),
        );

        const result = await ctx.db
          .insert(userDelegation)
          .values({
            ud_nanoid: ud_nanoid,
            connected_account: input.connected_account,
            weights: weightsRecord,
          })
          .execute();

        console.log("Insert operation result:", result);
        return { success: true, ud_nanoid };
      } catch (error) {
        console.error("Error in addDelegateWeights:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to insert delegation weights",
          cause: error,
        });
      }
    }),
});
