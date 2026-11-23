import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AuthCard } from '../components/auth-card';
import { SetNameForm } from './set-name-form';

// Shown to signed-in people who are not approved yet. Middleware keeps them here.
export default async function PendingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.status === 'active') redirect('/app');

  return (
    <AuthCard titleId="pending-title" title="Request received">
      <p className="auth-lede">
        An admin has to approve your access before you can see anything. You will be able to
        sign in and see your schedule once that happens.
      </p>
      <SetNameForm currentName={profile?.full_name ?? ''} />
      <form action="/auth/signout" method="post" className="auth-signout">
        <button type="submit" className="btn-ghost">Sign out</button>
      </form>
    </AuthCard>
  );
}

// Session-dependent page: never prerender.
export const dynamic = 'force-dynamic';
