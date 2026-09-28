import type { TransactionType } from "./types";

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
};

export function parseTransactionInput(input: unknown): TransactionInput | null {
  if (!input || typeof input !== "object") return null;
  const values = input as Record<string, unknown>;
  const type = values.type;
  const amount = Number(values.amount);
  const description = typeof values.description === "string" ? values.description.trim() : "";
  const date = typeof values.date === "string" ? values.date : "";

  if (type !== "INCOME" && type !== "EXPENSE") return null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(String(values.amount))) return null;
  if (description.length < 1 || description.length > 160) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsedDate = new Date(date + "T00:00:00.000Z");
  if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) return null;

  return { type, amount, description, date };
}

export function parseMonth(value: unknown): { month: number; year: number } | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2200 || month < 1 || month > 12) return null;
  return { month, year };
}

export function isValidId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseMoney(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return null;
  return amount;
}
