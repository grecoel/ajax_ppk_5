"use client";

import { useState } from "react";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { BudgetPanel } from "@/components/BudgetPanel";
import { DashboardSummary } from "@/components/DashboardSummary";
import { TransactionFilter } from "@/components/TransactionFilter";
import { TransactionList } from "@/components/TransactionList";
import type {
  BudgetSummary,
  DashboardTotals,
  SafeUser,
  Transaction,
  TransactionFilter as FilterType,
} from "@/lib/types";

type Props = {
  user: SafeUser;
  initialTransactions: Transaction[];
  initialSummary: DashboardTotals;
  initialBudget: BudgetSummary;
  initialFilter: FilterType;
  initialMonth: string;
  pageSize: number;
  today: string;
  pageRenderedAt: string;
  notice?: string;
  error?: string;
};

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function DashboardClient({
  user,
  initialTransactions,
  initialSummary,
  initialBudget,
  initialFilter,
  initialMonth,
  pageSize,
  today,
  pageRenderedAt,
  notice,
  error,
}: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [summary, setSummary] = useState(initialSummary);
  const [budget, setBudget] = useState(initialBudget);
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  async function refreshSummary() {
    const response = await fetch(
      "/api/dashboard/summary?month=" + encodeURIComponent(selectedMonth),
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not refresh the dashboard.");
    setSummary(data.summary as DashboardTotals);
    setBudget(data.budget as BudgetSummary);
  }

  // The created row comes from the POST JSON response and is inserted into
  // React state here. Summary and budget values are then fetched in the background.
  async function handleCreated(transaction: Transaction) {
    if (activeFilter === "ALL" || activeFilter === transaction.type) {
      setTransactions((current) =>
        [transaction, ...current.filter((item) => item.id !== transaction.id)]
          .sort((left, right) => right.date.localeCompare(left.date) || right.created_at.localeCompare(left.created_at))
          .slice(0, 100),
      );
    }
    await refreshSummary();
  }

  async function handleTransactionChanged() {
    const [transactionResponse, summaryResponse] = await Promise.all([
      fetch("/api/transactions?type=" + encodeURIComponent(activeFilter)),
      fetch("/api/dashboard/summary?month=" + encodeURIComponent(selectedMonth)),
    ]);
    const [transactionData, summaryData] = await Promise.all([
      transactionResponse.json(),
      summaryResponse.json(),
    ]);
    if (!transactionResponse.ok || !summaryResponse.ok) {
      throw new Error("Could not refresh the dashboard.");
    }
    setTransactions(transactionData.transactions as Transaction[]);
    setSummary(summaryData.summary as DashboardTotals);
    setBudget(summaryData.budget as BudgetSummary);
  }

  function handleFilterChange(filter: FilterType, filteredTransactions: Transaction[]) {
    setActiveFilter(filter);
    setTransactions(filteredTransactions);
  }

  function handleSummaryRefresh(nextSummary: DashboardTotals, nextBudget: BudgetSummary) {
    setSummary(nextSummary);
    setBudget(nextBudget);
  }

  function handleMonthChanged(month: string, nextBudget: BudgetSummary) {
    setSelectedMonth(month);
    setBudget(nextBudget);
  }

  function handleBudgetSaved(nextBudget: BudgetSummary) {
    setBudget(nextBudget);
  }

  return (
    <main className="page-shell dashboard-shell">
      <header className="site-header dashboard-header">
        <a className="brand" href="/dashboard" aria-label="Expense Tracker home">
          <span className="brand-mark" aria-hidden="true">ET</span>
          <span>Expense Tracker</span>
        </a>
        <div className="header-user">
          <span className="user-greeting">Welcome, <strong>{user.name}</strong></span>
          <form action="/api/auth/logout" method="POST">
            <button className="button button-secondary button-small" type="submit">Log out</button>
          </form>
        </div>
      </header>

      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">Personal finance</p>
          <h1>Your dashboard</h1>
        </div>
        <p className="render-timestamp">Demo: page rendered at <time>{pageRenderedAt}</time></p>
      </div>

      {notice && (
        <p className="page-notice success-text" role="status">
          {notice === "transaction-added" && "Transaction added. This page was rendered again after the form submission."}
          {notice === "transaction-updated" && "Transaction changed. The page was rendered again after the form submission."}
          {notice === "budget-saved" && "Budget saved. This page was rendered again after the form submission."}
        </p>
      )}
      {error && (
        <p className="page-notice error-text" role="alert">
          {error === "transaction" && "The transaction could not be saved. Check the fields and try again."}
          {error === "budget" && "The budget could not be saved. Check the fields and try again."}
        </p>
      )}

      <DashboardSummary
        summary={summary}
        selectedMonth={selectedMonth}
        onRefresh={handleSummaryRefresh}
      />

      <div className="dashboard-columns">
        <div className="dashboard-main-column">
          <section className="panel transactions-panel" aria-labelledby="transactions-title">
            <div className="panel-heading transaction-heading">
              <div>
                <p className="eyebrow">Your activity</p>
                <h2 id="transactions-title">Recent transactions</h2>
              </div>
              <TransactionFilter value={activeFilter} onChange={handleFilterChange} />
            </div>
            <TransactionList
              transactions={transactions}
              pageSize={pageSize}
              onChanged={handleTransactionChanged}
            />
            <div className="preference-row">
              <form action="/api/preferences" method="POST" className="page-size-form">
                <label htmlFor="page-size">Rows per page</label>
                <select id="page-size" name="pageSize" defaultValue={String(pageSize)}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
                <button type="submit" className="button button-text button-small">Save preference</button>
              </form>
              <span className="preference-note">Saved in a browser preference cookie</span>
            </div>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <AddTransactionForm today={today} onCreated={handleCreated} />
          <BudgetPanel
            key={selectedMonth}
            budget={budget}
            selectedMonth={selectedMonth}
            onMonthChanged={handleMonthChanged}
            onBudgetSaved={handleBudgetSaved}
          />
        </aside>
      </div>

      <footer className="page-footer">
        <span>Personal finance practice project</span>
        <span>Browser → fetch → Next.js Route Handler → PostgreSQL</span>
      </footer>
    </main>
  );
}

export { money };
