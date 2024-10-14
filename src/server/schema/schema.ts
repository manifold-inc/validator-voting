import { pgTable, varchar, json, timestamp, bigint } from "drizzle-orm/pg-core";

export const Account = pgTable("account", {
  txHash: varchar("tx_hash", { length: 66 }),
  ss58: varchar("ss58", { length: 256 }).primaryKey(),
  stake: bigint("stake", { mode: "bigint" }),
  weights: json("weights").$type<Record<string, number>>(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
