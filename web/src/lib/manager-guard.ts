import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Server-side check for manager pages and actions. Managers and admins only.
// RLS in the database is the real protection; this is a second layer.
export async function requireManager() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status !== 'active' || !['manager', 'admin'].includes(profile.role)) {
    notFound();
  }
  return { supabase, user };
}

// Read-only access to the weekly schedule: managers and admins (who can also edit) and
// viewers (who cannot). Use requireManager() for every write action; this guard is for
// rendering the page only. RLS still blocks viewer writes in the database.
export async function requireScheduleView() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status !== 'active' || !['viewer', 'manager', 'admin'].includes(profile.role)) {
    notFound();
  }
  // Default deny: only roles that may edit get controls; any other allowed role is read-only.
  return { supabase, user, readOnly: !['manager', 'admin'].includes(profile.role) };
}
