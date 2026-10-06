import Link from "next/link";
import { signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="page">
      <h1>Create your account</h1>
      <p className="mute">Study it. Explain it. Sabi wela.</p>
      {error && <p className="err" role="alert">{error}</p>}
      <form action={signup} className="box">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" autoComplete="name" />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password (at least 8 characters)</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <button className="btn block" style={{ marginTop: 16 }}>Create account</button>
      </form>
      <p>Already have an account? <Link href="/login">Log in</Link></p>
    </main>
  );
}
