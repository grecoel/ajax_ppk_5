import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { getBudgetSummary } from "@/lib/budgets";
import { getCurrentUser } from "@/lib/auth";
import { listTransactions, getDashboardTotals } from "@/lib/transactions";
import type { TransactionFilter } from "@/lib/types";
import { parseMonth } from "@/lib/validation";

type PageProps = {
  searchParams: Promise<{ type?: string; month?: string; notice?: string; error?: string }>;
};

function formatMonth(year: number, month: number) {
  return year + "-" + String(month).padStart(2, "0");
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const [user, params, cookieStore] = await Promise.all([
    getCurrentUser(),
    searchParams,
    cookies(),
  ]);
  if (!user) redirect("/login");

  const currentDate = new Date();
  const selected = parseMonth(params.month) ?? {
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  };
  const selectedMonth = formatMonth(selected.year, selected.month);
  const filter: TransactionFilter =
    params.type === "INCOME" || params.type === "EXPENSE" ? params.type : "ALL";
  const pageSizePreference = cookieStore.get("transaction_page_size")?.value;
  const pageSize = ["5", "10", "20"].includes(pageSizePreference ?? "")
    ? Number(pageSizePreference)
    : 5;

  const [initialTransactions, initialSummary, initialBudget] = await Promise.all([
    listTransactions(user.id, filter),
    getDashboardTotals(user.id),
    getBudgetSummary(user.id, selected.month, selected.year),
  ]);
  const pageRenderedAt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  const today = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, "0"),
    String(currentDate.getDate()).padStart(2, "0"),
  ].join("-");

  const notices: Record<string, string> = {
    "transaction-added": "transaction-added",
    "transaction-updated": "transaction-updated",
    "budget-saved": "budget-saved",
  };

  return (
    <DashboardClient
      user={user}
      initialTransactions={initialTransactions}
      initialSummary={initialSummary}
      initialBudget={initialBudget}
      initialFilter={filter}
      initialMonth={selectedMonth}
      pageSize={pageSize}
      today={today}
      pageRenderedAt={pageRenderedAt}
      notice={params.notice ? notices[params.notice] : undefined}
      error={params.error === "transaction" || params.error === "budget" ? params.error : undefined}
    />
  );
}
