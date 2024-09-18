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
  client: {},

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL_URL: process.env.VERCEL_ENV ?? "http://localhost:3000",
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
