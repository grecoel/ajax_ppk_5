import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env.local and check the value.");
}

declare global {
  // Reuse one pool during Next.js development hot reloads.
  var expenseTrackerPool: Pool | undefined;
}

export const pool =
  global.expenseTrackerPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  global.expenseTrackerPool = pool;
}
