import { pool } from "./db";
import type { BudgetSummary } from "./types";

export async function getBudgetSummary(
  userId: string,
  month: number,
  year: number,
): Promise<BudgetSummary> {
  const [budgetResult, spentResult] = await Promise.all([
    pool.query<{ amount: number }>(
      "SELECT amount::float8 AS amount FROM budgets WHERE user_id = $1 AND month = $2 AND year = $3",
      [userId, month, year],
    ),
    pool.query<{ spent: number }>(
      `SELECT COALESCE(SUM(amount), 0)::float8 AS spent
       FROM transactions
       WHERE user_id = $1
         AND type = 'EXPENSE'
         AND transaction_date >= make_date($3, $2, 1)
         AND transaction_date < make_date($3, $2, 1) + INTERVAL '1 month'`,
      [userId, month, year],
    ),
  ]);

  const amount = budgetResult.rows[0]?.amount ?? 0;
  const spent = spentResult.rows[0]?.spent ?? 0;
  return {
    month,
    year,
    amount,
    spent,
    remaining: amount - spent,
    usagePercent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
  };
}

export async function saveBudget(
  userId: string,
  month: number,
  year: number,
  amount: number,
): Promise<void> {
  await pool.query(
    `INSERT INTO budgets (user_id, month, year, amount)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, month, year) DO UPDATE
     SET amount = EXCLUDED.amount, updated_at = NOW()`,
    [userId, month, year, amount],
  );
}
