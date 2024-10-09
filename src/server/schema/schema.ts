import { pgTable, varchar, json, timestamp, bigint } from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz");
export const genId = {
  userDelegation: () => "uD_" + nanoid(27),
  userWeights: () => "uW_" + nanoid(27),
};

export const userDelegation = pgTable("user_delegation", {
  ud_nanoid: varchar("ud_nanoid", { length: 30 }).primaryKey(),
  txHash: varchar("tx_hash", { length: 66 }),
  connected_account: varchar("connected_account", { length: 256 }),
  stake: bigint("stake", { mode: "bigint" }),
  created_at: timestamp("created_at").defaultNow(),
});

export const userWeights = pgTable("user_weights", {
  uw_nanoid: varchar("uw_nanoid", { length: 30 }).primaryKey(),
  connected_account: varchar("connected_account", {length: 256}),
  weights: json("weights").$type<Record<string, number>>(),
})
