// Pure validation for "invite someone". No I/O, so it can be unit tested.
// An invite only creates a PENDING account: the person can sign in with an email code but sees
// nothing until an admin approves them and sets their role in Admin, Users.

export type InviteErrorCode = 'email-missing' | 'email-invalid' | 'name-missing' | 'name-long';
export type InviteResult =
  | { ok: true; value: { email: string; fullName: string } }
  | { ok: false; code: InviteErrorCode; error: string };

// Deliberately simple: one @, something before it, a dot in the domain, no spaces.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInvite(input: { email: string; fullName: string }): InviteResult {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (!email) return { ok: false, code: 'email-missing', error: 'Enter their email address.' };
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, code: 'email-invalid', error: 'Enter a valid email address.' };
  if (!fullName) return { ok: false, code: 'name-missing', error: 'Enter their name.' };
  if (fullName.length > 100) return { ok: false, code: 'name-long', error: 'Keep the name under 100 characters.' };
  return { ok: true, value: { email, fullName } };
}

// Invites per inviter in any 24 hours (security review WEB-INV-02). Set back to 10 on Jeff's
// request, 2026-11-23, now that onboarding is done.
export const INVITE_DAILY_LIMIT = 10;

// Shown on /invite?msg=<code>. Only these fixed texts can appear, and no name or email ever
// goes into the URL (security review WEB-INV-04).
export const INVITE_MESSAGES: Record<string, string> = {
  added: 'Added. They can sign in at parties.birdbowl.com with their email. An admin approves them before they see anything.',
  exists: 'That email already has an account.',
  limit: `You have reached today’s limit of ${INVITE_DAILY_LIMIT} invites. Try again tomorrow or ask Jeff.`,
  setup: 'Inviting is not set up yet. Ask Jeff to finish the setup.',
  error: 'Could not add that person. Try again.',
  'email-missing': 'Enter their email address.',
  'email-invalid': 'Enter a valid email address.',
  'name-missing': 'Enter their name.',
  'name-long': 'Keep the name under 100 characters.',
};
