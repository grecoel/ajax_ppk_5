import { NextResponse } from "next/server";
import { getBudgetSummary } from "@/lib/budgets";
import { getSessionUserId } from "@/lib/session";
import { getDashboardTotals } from "@/lib/transactions";
import { parseMonth } from "@/lib/validation";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const rawMonth = new URL(request.url).searchParams.get("month");
  const now = new Date();
  const selected = rawMonth ? parseMonth(rawMonth) : { month: now.getMonth() + 1, year: now.getFullYear() };
  if (!selected) return NextResponse.json({ error: "Month must use YYYY-MM format." }, { status: 400 });

  const [summary, budget] = await Promise.all([
    getDashboardTotals(userId),
    getBudgetSummary(userId, selected.month, selected.year),
  ]);
  return NextResponse.json({ summary, budget });
}
