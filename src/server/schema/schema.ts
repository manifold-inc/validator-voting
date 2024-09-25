import { pgTable, varchar, json, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz");
export const genId = {
  userDelegation: () => "uD_" + nanoid(27),
};

export const userDelegation = pgTable("user_delegation", {
  ud_nanoid: varchar("ud_nanoid", { length: 30 }).primaryKey(),
  connected_account: varchar("connected_account", { length: 256 }),
  weights: json("weights").$type<Record<string, number>>(),
  created_at: timestamp("created_at").default(sql`now()`),
});
