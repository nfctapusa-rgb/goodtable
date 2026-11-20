import { AuthForm } from "../authform";
export const metadata = { title: "Log in | Lokly" };
export default async function P({ searchParams }: { searchParams: Promise<{ sent?: string; expired?: string }> }) {
  const { sent, expired } = await searchParams;
  return (
    <>
      {expired && <p className="err-note narrow" style={{ marginTop: 20 }}>That sign-in link expired. Get a new one below.</p>}
      <AuthForm mode="login" />
      <section className="narrow magic">
        <p className="muted">Or skip the password:</p>
        {sent ? <p className="ok-note">If that email has a Lokly account, a sign-in link is on its way. Check your inbox.</p> : (
          <form method="post" action="/api/auth/link" className="form">
            <label>Email me a sign-in link<input name="email" type="email" autoComplete="email" placeholder="you@business.com" required /></label>
            <button className="btn ghost">Send my link</button>
          </form>
        )}
      </section>
    </>
  );
}
