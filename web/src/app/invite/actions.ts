'use server';

import { redirect } from 'next/navigation';
import { INVITE_DAILY_LIMIT, validateInvite } from '@/lib/invite';
import { requireSalesAccess } from '@/lib/sales-guard';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Only fixed message codes go in the URL; the page maps them to text.
function back(code: string): never {
  redirect(`/invite?msg=${encodeURIComponent(code)}`);
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

// Jeff's decision (2026-11-23): Jeff, Mady, Stephanie and Sophia may invite, i.e. the admin,
// sales and manager roles (requireSalesAccess). Viewers and staff may not.
// An invite only creates a PENDING account with the default role: the person can sign in with
// an email code but sees nothing until an admin approves them in Admin, Users.
// The inviter never chooses a role, so inviting cannot grant anyone access by itself.
export async function inviteUser(formData: FormData) {
  const { user } = await requireSalesAccess();

  const parsed = validateInvite({ email: field(formData, 'email'), fullName: field(formData, 'full_name') });
  if (!parsed.ok) back(parsed.code);
  const { email, fullName } = parsed.value;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    back('setup');
  }

  // Cap invites per inviter per 24 hours (needs migration 0007's invited_by column).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('invited_by', user.id)
    .gte('created_at', since);
  if (countError) back('error');
  if ((count ?? 0) >= INVITE_DAILY_LIMIT) back('limit');

  const { error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    // Who sent the invite. Only the server can set app_metadata; migration 0007's trigger copies
    // it into profiles.invited_by, shown on the Pending approval list.
    app_metadata: { invited_by: user.id },
  });

  if (error) {
    const exists = error.status === 422 || /already/i.test(error.message);
    back(exists ? 'exists' : 'error');
  }

  back('added');
}
