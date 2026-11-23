import { AuthCard } from '../components/auth-card';
import { CircleAlert } from '../components/icons';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <AuthCard titleId="login-title" title="Sign in">
      <p className="auth-lede">Enter your email. We will send you a one-time code. No password needed.</p>
      {reason === 'removed' ? (
        <p className="banner banner-danger" role="alert">
          <CircleAlert />
          <span>Your access has ended. Contact a manager if this is a mistake.</span>
        </p>
      ) : null}
      <LoginForm />
    </AuthCard>
  );
}

// Session-dependent page: never prerender.
export const dynamic = 'force-dynamic';
