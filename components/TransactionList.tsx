"use client";

import { useState, type FormEvent } from "react";
import type { Transaction } from "@/lib/types";

type Props = {
  transactions: Transaction[];
  pageSize: number;
  onChanged: () => Promise<void>;
};

type RequestState = "idle" | "loading" | "success" | "error";

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function displayDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value + "T12:00:00"));
}

export function TransactionList({ transactions, pageSize, onChanged }: Props) {
  if (transactions.length === 0) {
    return <div className="empty-state">No transactions match this filter yet.</div>;
  }

  return (
    <div className="transaction-list">
      {transactions.slice(0, pageSize).map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} onChanged={onChanged} />
      ))}
      {transactions.length > pageSize && (
        <p className="list-note">
          Showing {pageSize} of {transactions.length} matching recent transactions. Change the page-size preference below.
        </p>
      )}
    </div>
  );
}

function TransactionRow({ transaction, onChanged }: { transaction: Transaction; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<RequestState>("idle");
  const [deleteStatus, setDeleteStatus] = useState<RequestState>("idle");
  const [error, setError] = useState("");

  // ==================================================
  // AJAX DEMO START — PUT updated fields, then refresh list and totals
  // ==================================================
  async function handleAjaxEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      type: String(formData.get("type")),
      amount: String(formData.get("amount")),
      description: String(formData.get("description")),
      date: String(formData.get("date")),
    };
    setEditStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/transactions/" + transaction.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update transaction.");
      await onChanged();
      setEditing(false);
      setEditStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update transaction.");
      setEditStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  // ==================================================
  // AJAX DEMO START — DELETE the row without navigating away
  // ==================================================
  async function handleAjaxDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/transactions/" + transaction.id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete transaction.");
      await onChanged();
      setDeleteStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete transaction.");
      setDeleteStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  if (editing) {
    return (
      <article className="transaction-row edit-row">
        <form
          action={"/api/transactions/" + transaction.id}
          method="POST"
          onSubmit={handleAjaxEdit}
          className="edit-form"
        >
          <input type="hidden" name="_action" value="update" />
          <label>
            Description
            <input name="description" defaultValue={transaction.description} maxLength={160} required />
          </label>
          <label>
            Type
            <select name="type" defaultValue={transaction.type}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </label>
          <label>
            Amount
            <input name="amount" type="number" min="0.01" step="0.01" defaultValue={transaction.amount} required />
          </label>
          <label>
            Date
            <input name="date" type="date" defaultValue={transaction.date} required />
          </label>
          <div className="row-actions">
            <button className="button button-primary button-small" type="submit" disabled={editStatus === "loading"}>
              {editStatus === "loading" ? "Saving..." : "Save"}
            </button>
            <button className="button button-text button-small" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
        {editStatus === "error" && <p className="error-text" role="alert">{error}</p>}
      </article>
    );
  }

  return (
    <article className="transaction-row">
      <div className="transaction-description">
        <span className={"transaction-mark " + (transaction.type === "INCOME" ? "income-mark" : "expense-mark")} aria-hidden="true">
          {transaction.type === "INCOME" ? "+" : "−"}
        </span>
        <div>
          <strong>{transaction.description}</strong>
          <span>{displayDate(transaction.date)} · {transaction.type === "INCOME" ? "Income" : "Expense"}</span>
        </div>
      </div>
      <strong className={transaction.type === "INCOME" ? "income-text transaction-amount" : "expense-text transaction-amount"}>
        {transaction.type === "INCOME" ? "+" : "−"}{money.format(transaction.amount)}
      </strong>
      <div className="row-actions">
        {editStatus === "success" && <span className="visually-hidden" role="status">Transaction updated.</span>}
        <button className="button button-text button-small" type="button" onClick={() => setEditing(true)}>Edit</button>
        <form action={"/api/transactions/" + transaction.id} method="POST" onSubmit={handleAjaxDelete}>
          <input type="hidden" name="_action" value="delete" />
          <button className="button button-text button-small danger-button" type="submit" disabled={deleteStatus === "loading"}>
            {deleteStatus === "loading" ? "Deleting..." : "Delete"}
          </button>
        </form>
        {deleteStatus === "error" && <span className="error-text" role="alert">{error}</span>}
      </div>
    </article>
  );
}
