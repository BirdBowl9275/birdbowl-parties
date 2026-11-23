import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client with the service role key. It bypasses RLS, so it is used for
// exactly one thing: creating a pending account when an approved inviter adds someone
// (app/invite/actions.ts). Never import this from a client component.
// SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the browser.
export function createSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('The admin client is server-only.');
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Inviting is not set up. Set SUPABASE_SERVICE_ROLE_KEY on the server.');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
