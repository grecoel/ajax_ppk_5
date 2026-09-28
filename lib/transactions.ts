import { pool } from "./db";
import type { DashboardTotals, Transaction, TransactionFilter } from "./types";
import type { TransactionInput } from "./validation";

const transactionSelect = `SELECT
  id,
  type,
  amount::float8 AS amount,
  description,
  to_char(transaction_date, 'YYYY-MM-DD') AS date,
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at
FROM transactions`;

export async function listTransactions(
  userId: string,
  type: TransactionFilter = "ALL",
): Promise<Transaction[]> {
  const result =
    type === "ALL"
      ? await pool.query<Transaction>(
          transactionSelect + `
           WHERE user_id = $1
           ORDER BY transaction_date DESC, created_at DESC
           LIMIT 100`,
          [userId],
        )
      : await pool.query<Transaction>(
          transactionSelect + `
           WHERE user_id = $1 AND type = $2
           ORDER BY transaction_date DESC, created_at DESC
           LIMIT 100`,
          [userId, type],
        );
  return result.rows;
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
): Promise<Transaction> {
  const result = await pool.query<Transaction>(
    `INSERT INTO transactions (user_id, type, amount, description, transaction_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, amount::float8 AS amount, description,
       to_char(transaction_date, 'YYYY-MM-DD') AS date,
       to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at`,
    [userId, input.type, input.amount, input.description, input.date],
  );
  return result.rows[0];
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionInput,
): Promise<Transaction | null> {
  const result = await pool.query<Transaction>(
    `UPDATE transactions
     SET type = $3, amount = $4, description = $5,
         transaction_date = $6, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, type, amount::float8 AS amount, description,
       to_char(transaction_date, 'YYYY-MM-DD') AS date,
       to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS created_at`,
    [id, userId, input.type, input.amount, input.description, input.date],
  );
  return result.rows[0] ?? null;
}

export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM transactions WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
  return result.rowCount === 1;
}

export async function getDashboardTotals(userId: string): Promise<DashboardTotals> {
  const result = await pool.query<{
    income: number | null;
    expenses: number | null;
  }>(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'), 0)::float8 AS income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0)::float8 AS expenses
     FROM transactions
     WHERE user_id = $1`,
    [userId],
  );
  const income = result.rows[0].income ?? 0;
  const expenses = result.rows[0].expenses ?? 0;
  return { income, expenses, balance: income - expenses };
}
