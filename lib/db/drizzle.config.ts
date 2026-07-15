import { defineConfig } from "drizzle-kit";
import path from "path";

try {
  process.loadEnvFile(path.join(__dirname, "../../.env"));
} catch {}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
