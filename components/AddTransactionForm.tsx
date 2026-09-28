"use client";

import { useState, type FormEvent } from "react";
import type { Transaction } from "@/lib/types";

type Props = {
  today: string;
  onCreated: (transaction: Transaction) => Promise<void>;
};

type RequestState = "idle" | "loading" | "success" | "error";

export function AddTransactionForm({ today, onCreated }: Props) {
  const [status, setStatus] = useState<RequestState>("idle");
  const [error, setError] = useState("");

  // ==================================================
  // AJAX DEMO START
  // This handler is the primary teaching example.
  // Remove its onSubmit prop below to use the browser's normal form request.
  // ==================================================
  async function handleAjaxSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      type: String(formData.get("type")),
      amount: String(formData.get("amount")),
      description: String(formData.get("description")),
      date: String(formData.get("date")),
    };

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add transaction.");

      await onCreated(data.transaction as Transaction);
      form.reset();
      const dateInput = form.elements.namedItem("date");
      if (dateInput instanceof HTMLInputElement) dateInput.value = today;
      setStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add transaction.");
      setStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  return (
    <section className="panel add-panel" aria-labelledby="add-transaction-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">New entry</p>
          <h2 id="add-transaction-title">Add transaction</h2>
        </div>
      </div>
      <form
        action="/api/transactions"
        method="POST"
        onSubmit={handleAjaxSubmit}
        className="form-grid"
      >
        <label>
          Type
          <select name="type" defaultValue="EXPENSE" required>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </label>
        <label>
          Amount (IDR)
          <input name="amount" type="number" min="0.01" step="0.01" placeholder="45000" required />
        </label>
        <label className="wide-field">
          Description
          <input name="description" type="text" maxLength={160} placeholder="Lunch" required />
        </label>
        <label>
          Date
          <input name="date" type="date" defaultValue={today} required />
        </label>
        <div className="form-action">
          <button className="button button-primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Adding..." : "Add transaction"}
          </button>
        </div>
      </form>
      <RequestMessage status={status} error={error} success="Transaction added." />
    </section>
  );
}

function RequestMessage({ status, error, success }: { status: RequestState; error: string; success: string }) {
  if (status === "loading") return <p className="request-message" role="status">Sending request...</p>;
  if (status === "success") return <p className="request-message success-text" role="status">{success}</p>;
  if (status === "error") return <p className="request-message error-text" role="alert">{error}</p>;
  return null;
}
