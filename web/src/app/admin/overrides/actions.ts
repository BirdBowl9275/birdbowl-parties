'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';

function back(message: string): never {
  redirect(`/admin/overrides?msg=${encodeURIComponent(message)}`);
}

// Admin only. Turns the availability override flag on or off for active managers and admins.
// Only the people listed on the page are changed. The database guard also refuses any change to
// this flag from anyone who is not an admin (migration 0020).
export async function saveOverrideFlags(formData: FormData) {
  const { supabase } = await requireAdmin();

  const { data: people, error } = await supabase
    .from('profiles')
    .select('id, can_enter_availability')
    .eq('status', 'active')
    .in('role', ['manager', 'admin']);
  if (error) back('Could not load the list. Try again.');

  for (const p of people ?? []) {
    const want = formData.get(`flag-${p.id as string}`) === 'on';
    if (want === Boolean(p.can_enter_availability)) continue;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ can_enter_availability: want })
      .eq('id', p.id as string);
    if (updateError) back('Could not save every change. Refresh and check.');
  }

  back('Saved.');
}
