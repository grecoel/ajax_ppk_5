export type TransactionType = "INCOME" | "EXPENSE";
export type TransactionFilter = "ALL" | TransactionType;

export type SafeUser = {
  id: string;
  name: string;
  email: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  created_at: string;
};

export type DashboardTotals = {
  income: number;
  expenses: number;
  balance: number;
};

export type BudgetSummary = {
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  usagePercent: number;
};
