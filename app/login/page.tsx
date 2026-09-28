import Link from "next/link";

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">ET</span>
          <span>Expense Tracker</span>
        </Link>
        <p className="eyebrow">Welcome back</p>
        <h1>Log in</h1>
        <p className="auth-description">Use your account to see your personal transactions and budget.</p>
        {params.error === "invalid" && (
          <p className="form-error" role="alert">Email or password is incorrect.</p>
        )}
        <form action="/api/auth/login" method="POST" className="stacked-form">
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button-primary button-full" type="submit">Log in</button>
        </form>
        <p className="auth-switch">New here? <Link href="/register">Create an account</Link></p>
        <div className="demo-credentials">
          <strong>Demo account</strong>
          <span>demo@example.com</span>
          <span>demo12345</span>
        </div>
      </section>
    </main>
  );
}
