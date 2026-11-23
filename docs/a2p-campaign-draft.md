# A2P 10DLC campaign draft: Parties Sign-In (not submitted)

Status: DRAFT for review. Nothing has been submitted to Twilio or the carriers.
Brand: Bird Bowl (registered, Low Volume Standard).
Messaging Service: Parties Sign-In (sender: +1 786-259-1870, Homestead, FL).

## Use case
One-time passcode (2FA / verification) for staff sign-in to the internal party scheduling app.

## Campaign description (for the registration form)
Bird Bowl staff use a one-time passcode sent by SMS to sign in to Bird Bowl's internal party-host scheduling app. Each message contains a 6-digit code that expires shortly after it is sent. Messages are sent only when someone enters their own mobile number on the sign-in screen or asks for a new code.

## Sample messages (no personal data)
1. "Your Bird Bowl Party Scheduler code is 123456. It expires in 10 minutes. Don't share it."
2. "Your Bird Bowl sign-in code is 482910. If you did not request this, ignore this message."

Check the code length and expiry against the Supabase Phone settings before submitting.

## Opt-in
The person enters their own mobile number on the app's sign-in screen, and the number is used only for that sign-in. Staff are added by an admin before they can see the schedule.

## Opt-out and help
- STOP: handled by Twilio's standard opt-out for the messaging service.
- HELP: Twilio's standard help response; add contact details if the registration form asks for them.

## Message frequency
Only when someone requests a code. Expect a few messages per person per week at most.

## Data handling
Phone numbers are stored in the Parties Supabase project (see supabase/migrations/0001_init.sql), accessible only to signed-in staff under row-level security. Phone numbers are not shared with other parties.

## Before submitting, confirm
- [ ] Use case: "Verify users" in the messaging service corresponds to a one-time passcode campaign on the registration form.
- [ ] Sample messages match the Supabase SMS template exactly.
- [ ] Opt-in and privacy wording match what the app actually does.
- [ ] Registration fees and approval time are shown in the Twilio console before you submit.
- [ ] You approve submission. I will not submit this.
