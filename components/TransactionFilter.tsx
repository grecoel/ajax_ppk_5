"use client";

import { useState, type FormEvent } from "react";
import type { Transaction, TransactionFilter as FilterType } from "@/lib/types";

type Props = {
  value: FilterType;
  onChange: (filter: FilterType, transactions: Transaction[]) => void;
};

export function TransactionFilter({ value, onChange }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  // ==================================================
  // AJAX DEMO START — filter form has a normal GET fallback
  // ==================================================
  async function handleAjaxFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get("type")) as FilterType;
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/transactions?type=" + encodeURIComponent(type));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not filter transactions.");
      onChange(type, data.transactions as Transaction[]);
      setStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not filter transactions.");
      setStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  return (
    <form action="/dashboard" method="GET" onSubmit={handleAjaxFilter} className="filter-form">
      <label htmlFor="transaction-type-filter">Show</label>
      <select id="transaction-type-filter" name="type" defaultValue={value}>
        <option value="ALL">All</option>
        <option value="INCOME">Income</option>
        <option value="EXPENSE">Expense</option>
      </select>
      <button type="submit" className="button button-secondary button-small" disabled={status === "loading"}>
        {status === "loading" ? "Loading..." : "Apply filter"}
      </button>
      {status === "error" && <span className="error-text" role="alert">{error}</span>}
      {status === "success" && <span className="visually-hidden" role="status">Filter applied.</span>}
    </form>
  );
}
