# Bird Bowl Party Hostess Scheduler: Build Spec for Claude Code

Paste this into Claude Code as the starting prompt.

## What we're building

A web app for Bird Bowl that assigns birthday party hosts automatically for the whole week, Monday through Sunday. Sales enters parties. The app assigns hosts by role priority and spreads parties and kids fairly. Staff log in to see their own schedule. Managers see everything.

## Stack

- Supabase for login (email or phone one-time code, no passwords) and the Postgres database
- Row Level Security on every table so permissions are enforced in the database, not just hidden in the UI
- A simple web front end (Next.js or similar), mobile friendly since staff will check on their phones
- Start on the Supabase free plan. Plan to move to Pro for daily backups once live

## Users and roles

- **Pending:** anyone can request access, but sees nothing until approved
- **Staff:** sees only their own assigned parties
- **Sales:** can create, edit and cancel parties
- **Manager:** sees the full schedule, the fairness summary, and can manually reassign a party
- **Admin (Jeff):** approves or removes users, sets each person's role and host tier, sets availability rules

Removing a user should immediately end their access.

## Host tiers (priority order)

1. Party hostesses (hired as party hosts)
2. Front desk staff who also do parties
3. Servers who do parties

Lower tiers only get a party when every eligible person in the higher tier is unavailable, at their daily cap, or already booked at that time.

## Party data

Each party has: date, start time, end time, number of kids, party type (bowling or other), customer name, notes, and assigned host.

Monday through Friday parties are evening parties. Saturday and Sunday run all day.

## Hard rules

- Bowling parties starting after 6 p.m. go to servers only. This overrides the tier order
- One host per party, regardless of size
- Maximum three parties per host per day
- No overlapping time slots for the same host
- Only assign people who are marked available for that day and time

## Fairness logic

Two steps: first decide how many parties each person gets, then decide which parties.

- Step 1, party count: parties are spread evenly across party hostesses (one each before anyone gets a second, up to three a day) before any go to front desk, then servers. Example: three hostesses and three parties means one each
- Step 2, party size: balance by average kids per party over the last 30 days (rolling, counting assigned parties plus the ones being assigned now), across everyone. Compare averages, not total kids, because hostesses do more parties and their totals will always run higher
- Party hostesses may run an average up to 25% higher than everyone else (admin setting). Example: if front desk and servers average 16 kids per party, hostesses can average up to 20
- A person who picks up a single party gets a normal-sized one, not the biggest one just because their total is low
- Tie breaker: fewest parties in the last 30 days, then alphabetical
- The 30-day window length is an admin setting
- Re-running the assignment for the week should be possible after sales adds or cancels parties, without changing assignments a manager locked by hand

## Schedule visibility and late bookings

- Hosts see only their assigned time slots ahead of time ("Party, Saturday 2:00 to 4:00 p.m."), not which party, the customer, or the kid count
- Party details are revealed to the host on the morning of the party (time is an admin setting, default 8 a.m.). At that point the assignment is final
- Until the reveal, the app can reshuffle which party goes to which host within the same time slots when sales books or cancels a party, to keep the kid balance fair
- A reshuffle never changes a host's time slots without a manager confirming it, and never touches assignments a manager locked by hand
- Managers and sales always see full details

## Screens

- **Sales:** add and edit parties for the week, see which are assigned
- **Staff:** my upcoming party time slots, with full party details shown the morning of
- **Manager:** weekly schedule grid, fairness summary (parties, total kids and average kids per party per person over the last 30 days), manual reassign and lock
- **Admin:** pending approvals, user list with role, tier and availability, settings (window length, hostess allowance, lock cutoff, reveal time)

## Availability

Each host logs in and sets which days and time windows they can work. Admin and managers can edit it too. Availability for the coming week locks at a set cutoff (default Wednesday at 8 p.m. Eastern, adjustable in admin settings). After the lock, hosts can't change it themselves; a manager has to make the change. Assignments run after the lock.

## Build order

1. Supabase project, tables, and Row Level Security policies
2. Login with one-time code and the pending approval flow
3. Admin screen for users, roles, tiers, availability and settings
4. Sales party entry
5. Assignment engine with the hard rules and fairness logic, plus tests covering each rule
6. Staff and manager views, fairness summary
7. Deploy (Vercel or similar) and connect it at parties.birdbowl.com (DNS is on Cloudflare; same pattern as intercard.birdbowl.com and syncpay.birdbowl.com)
