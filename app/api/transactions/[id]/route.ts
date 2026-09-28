import { NextResponse } from "next/server";
import { deleteTransaction, updateTransaction } from "@/lib/transactions";
import { getSessionUserId } from "@/lib/session";
import { isValidId, parseTransactionInput } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

function nativeRedirect(request: Request, result: "success" | "error") {
  const target = new URL(
    result === "success" ? "/dashboard?notice=transaction-updated" : "/dashboard?error=transaction",
    request.url,
  );
  return NextResponse.redirect(target, 303);
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!isValidId(id)) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const input = parseTransactionInput(body);
  if (!input) return NextResponse.json({ error: "Check the transaction fields." }, { status: 400 });

  const transaction = await updateTransaction(userId, id, input);
  if (!transaction) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  return NextResponse.json({ transaction });
}

export async function DELETE(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!isValidId(id)) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  const deleted = await deleteTransaction(userId, id);
  if (!deleted) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}

// Native HTML forms cannot send PUT or DELETE, so POST keeps edit and delete
// working when JavaScript is disabled or the AJAX handler is commented out.
export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", request.url), 303);
  const { id } = await context.params;
  if (!isValidId(id)) return nativeRedirect(request, "error");

  const form = await request.formData();
  const action = String(form.get("_action") ?? "update");
  if (action === "delete") {
    const deleted = await deleteTransaction(userId, id);
    return nativeRedirect(request, deleted ? "success" : "error");
  }

  const input = parseTransactionInput(Object.fromEntries(form));
  if (!input) return nativeRedirect(request, "error");
  const transaction = await updateTransaction(userId, id, input);
  return nativeRedirect(request, transaction ? "success" : "error");
}
