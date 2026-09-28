import { NextResponse } from "next/server";
import { getBudgetSummary, saveBudget } from "@/lib/budgets";
import { getSessionUserId } from "@/lib/session";
import { parseMonth, parseMoney } from "@/lib/validation";

function nativeRedirect(request: Request, month: string, error?: string) {
  const target = new URL(
    error ? "/dashboard?month=" + encodeURIComponent(month) + "&error=budget" : "/dashboard?month=" + encodeURIComponent(month) + "&notice=budget-saved",
    request.url,
  );
  return NextResponse.redirect(target, 303);
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const rawMonth = params.get("month");
  const selected = parseMonth(rawMonth) ?? (() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  })();
  if (rawMonth && !parseMonth(rawMonth)) {
    return NextResponse.json({ error: "Month must use YYYY-MM format." }, { status: 400 });
  }

  const budget = await getBudgetSummary(userId, selected.month, selected.year);
  return NextResponse.json({ budget });
}

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const values = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const selected = parseMonth(values.month);
  const amount = parseMoney(values.amount);
  if (!selected || amount === null) {
    return NextResponse.json({ error: "Enter a month and a valid budget amount." }, { status: 400 });
  }

  await saveBudget(userId, selected.month, selected.year, amount);
  const budget = await getBudgetSummary(userId, selected.month, selected.year);
  return NextResponse.json({ budget });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", request.url), 303);
  const form = await request.formData();
  const rawMonth = String(form.get("month") ?? "");
  const selected = parseMonth(rawMonth);
  const amount = parseMoney(String(form.get("amount") ?? ""));
  if (!selected || amount === null) return nativeRedirect(request, rawMonth, "invalid");

  await saveBudget(userId, selected.month, selected.year, amount);
  return nativeRedirect(request, rawMonth);
}
