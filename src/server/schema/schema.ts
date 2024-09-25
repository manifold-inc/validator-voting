import { pgTable, varchar, json, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz");
export const genId = {
  userDelegation: () => "uD_" + nanoid(27),
  userStake: () => "uS_" + nanoid(27),
};

export const userDelegation = pgTable("user_delegation", {
  ud_nanoid: varchar("ud_nanoid", { length: 30 }).primaryKey(),
  connected_account: varchar("connected_account", { length: 256 }),
  weights: json("weights").$type<Record<string, number>>(),
  created_at: timestamp("created_at").default(sql`now()`),
});

export const userStake = pgTable("user_stake", {
  us_nanoid: varchar("us_nanoid", { length: 30 }).primaryKey(),
  connected_account: varchar("connected_account", { length: 256 }),
  stake: integer("stake").default(0),
  created_at: timestamp("created_at").default(sql`now()`),
});
