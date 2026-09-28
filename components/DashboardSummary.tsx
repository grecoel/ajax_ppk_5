"use client";

import { useState } from "react";
import type { BudgetSummary, DashboardTotals } from "@/lib/types";

type Props = {
  summary: DashboardTotals;
  selectedMonth: string;
  onRefresh: (summary: DashboardTotals, budget: BudgetSummary) => void;
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function DashboardSummary({ summary, selectedMonth, onRefresh }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  // ==================================================
  // AJAX DEMO START — refresh only the dashboard numbers
  // ==================================================
  async function handleAjaxSummaryRefresh() {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch(
        "/api/dashboard/summary?month=" + encodeURIComponent(selectedMonth),
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not refresh the summary.");
      onRefresh(data.summary as DashboardTotals, data.budget as BudgetSummary);
      setStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not refresh the summary.");
      setStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  return (
    <section className="summary-area" aria-label="Financial summary">
      <div className="summary-heading">
        <div>
          <p className="eyebrow">Your finances</p>
          <h2>Overview</h2>
        </div>
        <div className="refresh-area">
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={handleAjaxSummaryRefresh}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Refreshing..." : "Refresh summary"}
          </button>
          {status === "success" && <span className="success-text" role="status">Updated</span>}
          {status === "error" && <span className="error-text" role="alert">{error}</span>}
        </div>
      </div>
      <div className="summary-grid">
        <article className="summary-card balance-card">
          <span>Balance</span>
          <strong>{money.format(summary.balance)}</strong>
          <small>Income minus expenses</small>
        </article>
        <article className="summary-card">
          <span>Total income</span>
          <strong className="income-text">{money.format(summary.income)}</strong>
          <small>All recorded income</small>
        </article>
        <article className="summary-card">
          <span>Total expenses</span>
          <strong className="expense-text">{money.format(summary.expenses)}</strong>
          <small>All recorded expenses</small>
        </article>
      </div>
    </section>
  );
}
