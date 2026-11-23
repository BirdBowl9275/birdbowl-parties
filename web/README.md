# Party Hostess Scheduler: web app

Step 2 of the build: sign-in with a one-time email code, and the pending approval flow.

## Run locally

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and publishable (anon) key.
2. Apply `../supabase/migrations/0001_init.sql` to that Supabase project (SQL editor) once approved.
3. `npm install`, then `npm run dev`.

## Checks

- `npm test`: routing rules (12 tests)
- `npm run typecheck`
- `npm run build`

## Supabase dashboard settings needed for email codes

- Authentication > Providers > Email: enabled. Sign-ups allowed (people request access; they stay pending until approved).
- Authentication > Email Templates > Magic Link: the email must include `{{ .Token }}` so the person gets a code, not only a link.

## Phone sign-in with Twilio (set up in the Supabase dashboard)

Twilio credentials go only into the Supabase dashboard. Never put them in this repo, in `.env` files, or in chat.

1. In Twilio, create or pick a Messaging Service and note its SID (starts with `MG`). Use an API key for Supabase, not your main auth token, if your Twilio account supports it.
2. US texts need a registered brand and campaign (A2P 10DLC). Without it, carriers block or filter the messages. Start that registration early, since it can take days to weeks.
3. In Supabase: Authentication > Providers > Phone. Turn on Phone sign-in, choose Twilio, and enter the Account SID, the auth token or API key, and the Messaging Service SID.
4. Edit the SMS message template in Supabase (Authentication, the SMS or phone message template). It must include `{{ .Code }}`, so the person gets a code.
5. Keep "Confirm phone" on and set the OTP length to 6.
6. Test with your own mobile number first.

Phone-only users have no email on their profile. The first-admin SQL below matches on email, so use the phone number instead for that account: `where phone = '+1XXXXXXXXXX'`.

## First admin

The first admin can't be approved from the app, because nobody is an admin yet. After Jeff signs in once (it creates a pending profile), run this once in the Supabase SQL editor, with the real email filled in:

```sql
update public.profiles
set status = 'active', role = 'admin', approved_at = now()
where email = 'YOUR-EMAIL-HERE';
```

Run it only on the real project, not on test data.

## Security notes

- The app uses only the publishable key. The service role key must never be in this app.
- Middleware controls which screen a person sees. Row Level Security in the database decides what data they can read or change.
