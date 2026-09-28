import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../lib/db";

async function main() {
  const schema = await readFile(resolve(process.cwd(), "database/schema.sql"), "utf8");
  await pool.query(schema);
  console.log("Database schema is ready.");
}

main()
  .catch((error: unknown) => {
    console.error("Database setup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
