# Teaching guide: what AJAX changes

This project uses the same Expense Tracker UI for two request patterns. The primary Add Transaction form is a real HTML form first. Its server endpoint accepts either a regular browser form post or a JSON request made with fetch.

## 1. Architecture

~~~text
Browser
  ├─ regular form submission or fetch()
  ↓
Next.js Route Handler
  ├─ reads form data or JSON
  ├─ checks the session cookie and current user
  ├─ validates and scopes the query
  ↓
PostgreSQL
  └─ returns rows or a write result
  ↓
Route Handler
  ├─ redirects after a regular form submission
  └─ returns JSON after a fetch request
  ↓
Browser
  ├─ renders a new page after a regular form submission
  └─ updates selected React state after fetch()
~~~

The browser never connects directly to PostgreSQL. It sends HTTP requests to Next.js. The server reads the session, performs a parameterized database query, and returns either a redirect or JSON.

## 2. Find the AJAX code

Search the project for:

~~~text
AJAX DEMO START
~~~

The primary example is in components/AddTransactionForm.tsx, in handleAjaxSubmit. The form's onSubmit prop connects the event to that function.

Related examples are in:

- components/TransactionFilter.tsx: GET /api/transactions?type=...
- components/TransactionList.tsx: PUT /api/transactions/:id and DELETE /api/transactions/:id
- components/BudgetPanel.tsx: GET /api/budget?month=... and PUT /api/budget
- components/DashboardSummary.tsx: GET /api/dashboard/summary?month=...

## 3. Main classroom demonstration: Add Transaction

Start the app and log in. In the browser's Elements panel, the transaction form submits to /api/transactions using POST.

### Demonstrate the normal browser form

1. Open components/AddTransactionForm.tsx.
2. Find the form line:

   ~~~tsx
   onSubmit={handleAjaxSubmit}
   ~~~

3. Temporarily disable the handler by changing that line to:

   ~~~tsx
   onSubmit={/* AJAX disabled for this demonstration */ undefined}
   ~~~

   This keeps the JSX valid while leaving the form without a submit handler. Restore the original line after the demonstration.

4. Add a transaction.
5. The browser sends a normal POST request to /api/transactions with form-encoded fields.
6. The Route Handler reads request.formData(), inserts the row, then sends a 303 redirect to /dashboard.
7. The browser loads the dashboard again. The transaction appears and the “Demo: page rendered at” time changes.

This fallback is real HTML form behavior. It does not depend on JavaScript pretending to reload the page.

### Demonstrate AJAX

1. Restore onSubmit={handleAjaxSubmit}.
2. Add another transaction.
3. The handler calls event.preventDefault(), so the browser does not perform its normal form navigation.
4. fetch() sends a POST request to /api/transactions with a JSON body.
5. The same Route Handler inserts the row and returns JSON with status 201.
6. The component uses the returned transaction to update React state. It fetches the dashboard summary and budget in the background.
7. The row, totals, and budget indicator update without a full-page load. The “Demo: page rendered at” time stays the same.

The server stores the data in both cases. The difference is the request format and what the browser does with the response: follow a redirect and render a document, or receive JSON and update part of the current view.

## 4. Read the primary handler

The main teaching code in components/AddTransactionForm.tsx follows this order:

~~~tsx
event.preventDefault();
const formData = new FormData(form);
const response = await fetch("/api/transactions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const data = await response.json();
await onCreated(data.transaction);
~~~

The surrounding code sets the button to “Adding...” while the request is in progress, handles non-success HTTP responses, and shows a success or error message. The React state update is delegated to DashboardClient.handleCreated.

## 5. Browser → Route Handler → PostgreSQL

For the JSON version of Add Transaction:

1. The browser builds a request body from the named form fields.
2. fetch sends it to POST /api/transactions.
3. app/api/transactions/route.ts reads the session cookie, parses JSON, and validates the fields.
4. lib/transactions.ts runs an INSERT using placeholders ($1, $2, ...).
5. PostgreSQL stores the transaction.
6. The Route Handler returns JSON. React adds the returned transaction to its local list.

The non-AJAX version uses the same endpoint. The Content-Type header tells it whether to call request.json() or request.formData(). After a regular form post, it returns a redirect instead of JSON.

## 6. GET and POST in this project

- GET reads data and should not change it. Examples: GET /api/transactions?type=EXPENSE, GET /api/budget?month=2026-09, and GET /api/dashboard/summary?month=2026-09.
- POST submits form data or creates a record. Add Transaction uses POST /api/transactions.
- PUT changes an existing resource. AJAX editing uses PUT /api/transactions/:id; saving a budget uses PUT /api/budget.
- DELETE removes a transaction through DELETE /api/transactions/:id.

HTML forms support GET and POST directly. The edit and delete forms also use POST as a non-AJAX fallback; the route recognizes the hidden _action field. Their AJAX handlers use the clearer PUT and DELETE methods.

The filter form demonstrates the GET difference. With its submit handler enabled, it fetches /api/transactions?type=EXPENSE and replaces the list. Without the handler, the browser navigates to /dashboard?type=EXPENSE and renders the page again.

## 7. Loading, success, and error

The components keep simple request states in React:

- Idle: the user has not started the request.
- Loading: the button changes label and is disabled while fetch is pending.
- Success: a short confirmation appears.
- Error: the server message or a simple fallback error is shown.

These states make the asynchronous request visible. The browser remains usable while waiting, and only the affected component state needs to change.

## 8. AJAX is not a programming language

AJAX is a name for a browser/server request pattern. It does not define a language. Older examples commonly used XMLHttpRequest. This project uses the browser's Fetch API, which provides promises and a compact interface for sending HTTP requests and reading responses.

The data can be JSON, as in this project, but AJAX does not require JSON. The key idea is that JavaScript sends or handles an HTTP request without asking the browser to replace the whole page for every response.

## 9. Cookies and sessions from the previous lesson

After login, app/api/auth/login/route.ts verifies the bcrypt password and creates a row in the sessions table. lib/session.ts generates a random session ID, stores that ID in PostgreSQL, and sets the same ID in the expense_session cookie.

The cookie is HttpOnly, SameSite=Lax, and Secure in production. It contains only the session ID, never the user's ID or password. On later requests, the server uses the cookie's session ID to find the session row and derive the user ID.

The separate transaction_page_size cookie stores a harmless page-size preference. The preference form lets the user select 5, 10, or 20 recent transactions.

## 10. Authorization and database queries

lib/transactions.ts and lib/budgets.ts hold the PostgreSQL queries. They use parameterized SQL. Transaction reads, edits, and deletes include both the requested record ID and the authenticated user ID. Budget reads and writes include the authenticated user ID, month, and year.

The browser never submits a trusted user_id. The Route Handler derives it from the database-backed session. The database also enforces unique user/month/year budgets and basic type, amount, and date constraints.

## 11. Network tab walkthrough

Open browser DevTools → Network. Enable Preserve log if you want to compare requests after navigation.

- With the Add Transaction handler disabled, submit once. Find POST /api/transactions, followed by a 303 redirect and a new document request for /dashboard.
- With the handler restored, submit again. Find POST /api/transactions with Content-Type application/json and a JSON response. There should be no new document request.
- Edit a row to see PUT /api/transactions/:id and follow-up GET requests for the list and dashboard summary.
- Delete a row to see DELETE /api/transactions/:id.
- Change the transaction filter to see GET /api/transactions?type=...
- Change the budget month to see GET /api/budget?month=...
- Save the budget to see PUT /api/budget.
- Click Refresh summary to see GET /api/dashboard/summary?month=...

The timestamp is a quick visual check: a full document load renders a new time; fetch-based updates leave the rendered time unchanged.
