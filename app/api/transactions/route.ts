import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createTransaction, listTransactions } from "@/lib/transactions";
import type { TransactionFilter } from "@/lib/types";
import { parseTransactionInput } from "@/lib/validation";

function nativeRedirect(request: Request, result: "success" | "error") {
  const target = new URL(
    result === "success" ? "/dashboard?notice=transaction-added" : "/dashboard?error=transaction",
    request.url,
  );
  return NextResponse.redirect(target, 303);
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const requestedType = new URL(request.url).searchParams.get("type") ?? "ALL";
  if (!["ALL", "INCOME", "EXPENSE"].includes(requestedType)) {
    return NextResponse.json({ error: "Invalid transaction filter." }, { status: 400 });
  }

  const transactions = await listTransactions(userId, requestedType as TransactionFilter);
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    if (request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const isAjax = request.headers.get("content-type")?.includes("application/json") ?? false;
  let submitted: unknown;
  try {
    submitted = isAjax ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return isAjax
      ? NextResponse.json({ error: "Invalid request body." }, { status: 400 })
      : nativeRedirect(request, "error");
  }

  const input = parseTransactionInput(submitted);
  if (!input) {
    return isAjax
      ? NextResponse.json({ error: "Check the transaction fields and try again." }, { status: 400 })
      : nativeRedirect(request, "error");
  }

  const transaction = await createTransaction(userId, input);
  return isAjax
    ? NextResponse.json({ transaction }, { status: 201 })
    : nativeRedirect(request, "success");
}
