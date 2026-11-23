import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <section className="card" aria-labelledby="login-title">
      <h1 id="login-title">Sign in</h1>
      <p>Enter your email. We will send you a one-time code. No password needed.</p>
      {reason === 'removed' ? (
        <p className="notice" role="alert">Your access has ended. Contact a manager if this is a mistake.</p>
      ) : null}
      <LoginForm />
    </section>
  );
}

// Session-dependent page: never prerender.
export const dynamic = 'force-dynamic';
