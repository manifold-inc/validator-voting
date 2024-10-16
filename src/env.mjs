import { createEnv } from "@t3-oss/env-nextjs";
import { configDotenv } from "dotenv";
import { z } from "zod";

configDotenv({ path: "./../.env" });

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    DATABASE_URL: z.string(),
    VERCEL_URL: z.string(),
  },
  client: {
    NEXT_PUBLIC_VALIDATOR_NAME: z.string(),
    NEXT_PUBLIC_VALIDATOR_ADDRESS: z.string(),
    NEXT_PUBLIC_POLKADOT_EXTENSION_ID: z.string(),
    NEXT_PUBLIC_FINNEY_ENDPOINT: z.string(),
    NEXT_PUBLIC_INCLUDE_OWNER_VOTES: z.string().optional()
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL_URL: process.env.VERCEL_ENV ?? "http://localhost:3000",
    NEXT_PUBLIC_VALIDATOR_NAME: process.env.NEXT_PUBLIC_VALIDATOR_NAME,
    NEXT_PUBLIC_VALIDATOR_ADDRESS: process.env.NEXT_PUBLIC_VALIDATOR_ADDRESS,
    NEXT_PUBLIC_POLKADOT_EXTENSION_ID:
      process.env.NEXT_PUBLIC_POLKADOT_EXTENSION_ID,
    NEXT_PUBLIC_FINNEY_ENDPOINT: process.env.NEXT_PUBLIC_FINNEY_ENDPOINT,
    NEXT_PUBLIC_INCLUDE_OWNER_VOTES: process.env.NEXT_PUBLIC_INCLUDE_OWNER_VOTES
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
