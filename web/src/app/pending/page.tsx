import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
    <section className="card" aria-labelledby="pending-title">
      <h1 id="pending-title">Request received</h1>
      <p>
        An admin has to approve your access before you can see anything. You will be able to
        sign in and see your schedule once that happens.
      </p>
      <SetNameForm currentName={profile?.full_name ?? ''} />
      <form action="/auth/signout" method="post">
        <button type="submit" className="secondary">Sign out</button>
      </form>
    </section>
  );
}

// Session-dependent page: never prerender.
export const dynamic = 'force-dynamic';
