import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../lib/db";

const demoUserId = "11111111-1111-4111-8111-111111111111";

function dateInCurrentMonth(day: number): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(safeDay).padStart(2, "0"),
  ].join("-");
}

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 12);
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
     SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
    [demoUserId, "Alex Student", "demo@example.com", passwordHash],
  );

  const seedTransactions = [
    ["22222222-2222-4222-8222-222222222221", "INCOME", 2500000, "Monthly allowance", 2],
    ["22222222-2222-4222-8222-222222222222", "EXPENSE", 45000, "Lunch", 4],
    ["22222222-2222-4222-8222-222222222223", "EXPENSE", 30000, "Transport", 6],
    ["22222222-2222-4222-8222-222222222224", "EXPENSE", 275000, "Internet", 9],
    ["22222222-2222-4222-8222-222222222225", "EXPENSE", 180000, "Programming books", 12],
    ["22222222-2222-4222-8222-222222222226", "INCOME", 750000, "Freelance website update", 15],
  ] as const;

  for (const [id, type, amount, description, day] of seedTransactions) {
    await pool.query(
      `INSERT INTO transactions (id, user_id, type, amount, description, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         type = EXCLUDED.type,
         amount = EXCLUDED.amount,
         description = EXCLUDED.description,
         transaction_date = EXCLUDED.transaction_date,
         updated_at = NOW()`,
      [id, demoUserId, type, amount, description, dateInCurrentMonth(day)],
    );
  }

  const now = new Date();
  await pool.query(
    `INSERT INTO budgets (user_id, month, year, amount)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, month, year) DO UPDATE
     SET amount = EXCLUDED.amount, updated_at = NOW()`,
    [demoUserId, now.getMonth() + 1, now.getFullYear(), 1200000],
  );

  console.log("Demo data is ready. Sign in with demo@example.com / demo12345.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
