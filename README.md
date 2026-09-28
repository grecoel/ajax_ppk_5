# AJAX Expense Tracker

A small, working expense tracker for teaching standard HTML form submissions, Fetch API requests, Next.js Route Handlers, PostgreSQL queries, cookies, and database-backed sessions.

The project uses Next.js App Router, TypeScript, PostgreSQL through the pg driver, bcryptjs, and a custom session implementation. It does not use an ORM or a client-side data-fetching library.

## Prerequisites

- Node.js 20.9 or newer
- Docker Desktop (or Docker Engine with Compose)
- npm

## Run it locally

Commands below start PostgreSQL, install the app dependencies, create the tables, add the demo data, and start Next.js.

### Windows PowerShell

From the project folder:

~~~powershell
Copy-Item .env.example .env
docker compose up -d
npm install
npm run db:setup
npm run db:seed
npm run dev
~~~

Open http://localhost:3000.

This Compose project exposes PostgreSQL on host port 5433 and the container's port 5432. The example uses 5433 so it can run beside an existing local PostgreSQL service. If 5433 is already in use, change the host side of the port mapping in docker-compose.yml and the port in DATABASE_URL in .env.

### macOS, Linux, or another normal terminal

From the project folder:

~~~sh
cp .env.example .env
docker compose up -d
npm install
npm run db:setup
npm run db:seed
npm run dev
~~~

Open http://localhost:3000.

This Compose project exposes PostgreSQL on host port 5433 and the container's port 5432. The example uses 5433 so it can run beside an existing local PostgreSQL service. If 5433 is already in use, change the host side of the port mapping in docker-compose.yml and the port in DATABASE_URL in .env.

The database container has a health check. If the first schema command runs before PostgreSQL is ready, wait a few seconds and run npm run db:setup again.

## Demo account

- Email: demo@example.com
- Password: demo12345

The seed script adds examples for a monthly allowance, lunch, transport, internet, books, and freelance income, plus a budget for the current month. The script can be run again safely to restore those demo records.

## Useful commands

~~~sh
npm run dev
npm run typecheck
npm run lint
npm run build
npm run db:setup
npm run db:seed
~~~

Stop PostgreSQL with docker compose down. This keeps its named data volume. Use docker compose down -v only if you intend to delete the local database contents.

## Project map

- app/api/auth: registration, login, and logout form routes
- app/api/transactions: transaction list/create and item update/delete routes
- app/api/budget: monthly budget read and save routes
- app/api/dashboard/summary: dashboard totals and budget refresh
- app/dashboard/page.tsx: session check and initial server-side dashboard data
- components/AddTransactionForm.tsx: primary AJAX teaching example
- components/TransactionFilter.tsx: GET filter with both navigation and fetch behavior
- components/TransactionList.tsx: edit and delete actions
- components/BudgetPanel.tsx: month selection and budget requests
- lib/session.ts: database-backed session cookie
- lib/transactions.ts and lib/budgets.ts: parameterized PostgreSQL queries
- database/schema.sql: tables, constraints, and indexes
- database/seed.ts: demo account and sample data
- TEACHING_GUIDE.md: classroom walkthrough and request-flow explanation

See TEACHING_GUIDE.md for the exact non-AJAX/AJAX demonstration steps.
