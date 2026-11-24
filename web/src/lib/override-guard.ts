import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Manager or admin who has the availability override flag. The database enforces the same rule
// (migration 0020). This check only decides whether the page is shown and the action runs.
export async function requireOverrideAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, can_enter_availability')
    .eq('id', user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.status !== 'active' ||
    profile.can_enter_availability !== true ||
    !['manager', 'admin'].includes(profile.role as string)
  ) {
    notFound();
  }
  return { supabase, user };
}
