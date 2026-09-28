import Link from "next/link";

type PageProps = { searchParams: Promise<{ error?: string }> };

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const errorText =
    params.error === "exists"
      ? "An account already uses that email."
      : params.error === "invalid"
        ? "Enter a name, valid email, and password with at least 8 characters."
        : "";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">ET</span>
          <span>Expense Tracker</span>
        </Link>
        <p className="eyebrow">Get started</p>
        <h1>Create account</h1>
        <p className="auth-description">Your transactions and budget are private to your account.</p>
        {errorText && <p className="form-error" role="alert">{errorText}</p>}
        <form action="/api/auth/register" method="POST" className="stacked-form">
          <label>
            Name
            <input name="name" type="text" autoComplete="name" maxLength={100} required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button className="button button-primary button-full" type="submit">Create account</button>
        </form>
        <p className="auth-switch">Already registered? <Link href="/login">Log in</Link></p>
      </section>
    </main>
  );
}
