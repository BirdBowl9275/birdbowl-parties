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

// Read-only access to the parties list: viewers, plus everyone who may enter parties.
// Use requireSalesAccess() for every write action; this guard is for rendering the page only.
export async function requirePartiesView() {
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

  const allowed = ['viewer', 'sales', 'manager', 'admin'];
  if (!profile || profile.status !== 'active' || !allowed.includes(profile.role)) {
    notFound();
  }
  // Default deny: only roles that may edit get controls; any other allowed role is read-only.
  const canEdit = ['sales', 'manager', 'admin'].includes(profile.role);
  return { supabase, user, role: profile.role as string, readOnly: !canEdit };
}
