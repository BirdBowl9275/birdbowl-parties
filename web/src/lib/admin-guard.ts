import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Server-side check for admin pages and actions. Middleware only checks sign-in and approval.
// The database policies are the real protection, so this check is a second layer.
export async function requireAdmin() {
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

  if (!profile || profile.status !== 'active' || profile.role !== 'admin') {
    // Hide the admin area from everyone who is not an admin.
    notFound();
  }
  return { supabase, user };
}
