"use client";

import { useState, type FormEvent } from "react";
import type { BudgetSummary } from "@/lib/types";

type Props = {
  budget: BudgetSummary;
  selectedMonth: string;
  onMonthChanged: (month: string, budget: BudgetSummary) => void;
  onBudgetSaved: (budget: BudgetSummary) => void;
};

type RequestState = "idle" | "loading" | "success" | "error";

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function BudgetPanel({ budget, selectedMonth, onMonthChanged, onBudgetSaved }: Props) {
  const [monthStatus, setMonthStatus] = useState<RequestState>("idle");
  const [saveStatus, setSaveStatus] = useState<RequestState>("idle");
  const [error, setError] = useState("");

  // ==================================================
  // AJAX DEMO START — GET budget summary for a selected month
  // ==================================================
  async function handleAjaxMonthChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const month = String(formData.get("month"));
    setMonthStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/budget?month=" + encodeURIComponent(month));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the budget.");
      onMonthChanged(month, data.budget as BudgetSummary);
      setMonthStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load the budget.");
      setMonthStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  // ==================================================
  // AJAX DEMO START — PUT a budget and update this panel
  // ==================================================
  async function handleAjaxBudgetSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = {
      month: String(formData.get("month")),
      amount: String(formData.get("amount")),
    };
    setSaveStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save the budget.");
      onBudgetSaved(data.budget as BudgetSummary);
      setSaveStatus("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save the budget.");
      setSaveStatus("error");
    }
  }
  // ==================================================
  // AJAX DEMO END
  // ==================================================

  const progressWidth = Math.min(Math.max(budget.usagePercent, 0), 100);

  return (
    <section className="panel budget-panel" aria-labelledby="budget-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Plan your spending</p>
          <h2 id="budget-title">Monthly budget</h2>
        </div>
        <form action="/dashboard" method="GET" onSubmit={handleAjaxMonthChange} className="month-form">
          <label htmlFor="budget-month">Month</label>
          <input id="budget-month" key={selectedMonth} type="month" name="month" defaultValue={selectedMonth} required />
          <button className="button button-secondary button-small" type="submit" disabled={monthStatus === "loading"}>
            {monthStatus === "loading" ? "Loading..." : "View"}
          </button>
        </form>
      </div>

      <div className="budget-numbers">
        <div><span>Budget</span><strong>{money.format(budget.amount)}</strong></div>
        <div><span>Spent</span><strong className="expense-text">{money.format(budget.spent)}</strong></div>
        <div><span>Remaining</span><strong className={budget.remaining < 0 ? "expense-text" : ""}>{money.format(budget.remaining)}</strong></div>
      </div>
      <div className="progress-meta">
        <span>Budget used</span>
        <strong>{budget.usagePercent}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Monthly budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressWidth}
      >
        <div className={budget.usagePercent > 100 ? "progress-fill over-budget" : "progress-fill"} style={{ width: progressWidth + "%" }} />
      </div>

      <form action="/api/budget" method="POST" onSubmit={handleAjaxBudgetSave} className="budget-form">
        <input key={"month-" + selectedMonth} type="hidden" name="month" value={selectedMonth} readOnly />
        <label>
          Set or update budget (IDR)
          <input key={"amount-" + selectedMonth} type="number" name="amount" min="0" step="0.01" defaultValue={budget.amount || ""} placeholder="1200000" required />
        </label>
        <button className="button button-primary" type="submit" disabled={saveStatus === "loading"}>
          {saveStatus === "loading" ? "Saving..." : "Save budget"}
        </button>
      </form>
      {monthStatus === "success" && <p className="request-message success-text" role="status">Budget month loaded.</p>}
      {saveStatus === "success" && <p className="request-message success-text" role="status">Budget saved.</p>}
      {(monthStatus === "error" || saveStatus === "error") && <p className="request-message error-text" role="alert">{error}</p>}
    </section>
  );
}
