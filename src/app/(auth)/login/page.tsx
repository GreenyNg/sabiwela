import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <main className="page">
      <h1>Welcome back</h1>
      <p className="mute">Don&apos;t just study. Sabi wela.</p>
      {error && <p className="err" role="alert">{error}</p>}
      {message && <p className="note" role="status">{message}</p>}
      <form action={login} className="box">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
        <button className="btn block" style={{ marginTop: 16 }}>Log in</button>
      </form>
      <p>New here? <Link href="/signup">Create an account</Link></p>
    </main>
  );
}
