import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Server-side check for party entry. Sales, managers and admins may enter parties.
// RLS in the database is the real protection; this is a second layer.
export async function requireSalesAccess() {
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

  const allowed = ['sales', 'manager', 'admin'];
  if (!profile || profile.status !== 'active' || !allowed.includes(profile.role)) {
    notFound();
  }
  return { supabase, user, role: profile.role as string };
}
