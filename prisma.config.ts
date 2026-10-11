import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";

// Load env files the same way Next.js does (.env.local, .env, ...)
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
