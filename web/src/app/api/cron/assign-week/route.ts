import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { loadWeekInput } from '@/lib/engine-data';
import { assignWeek } from '@/lib/engine';
import { nowClockBusiness, todayBusiness, validWeekStart } from '@/lib/parties';
import { autoRunDays, isAutoRunWindow } from '@/lib/auto-assign';

// Runs the assignment for Thursday to Sunday of the current schedule week, from 8:00 p.m. Eastern on
// Wednesday (see vercel.json; the cron runs once a week). Vercel sends "Authorization: Bearer <CRON_SECRET>". Anything else
// gets a 404, so the endpoint does not reveal that it exists.
//
// It uses the service-role client, because no manager is signed in during a cron run. It saves only
// the host column, and only for parties that are unlocked and not yet revealed.
export const dynamic = 'force-dynamic';

function tokenMatches(header: string, secret: string): boolean {
  // Hash both sides to the same length, so the comparison takes the same time whatever is sent.
  const given = createHash('sha256').update(header).digest();
  const expected = createHash('sha256').update(`Bearer ${secret}`).digest();
  return timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !tokenMatches(request.headers.get('authorization') ?? '', secret)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const now = new Date();
  if (!isAutoRunWindow(now)) {
    return NextResponse.json({ ran: false, reason: 'outside the Wednesday 8 p.m. Eastern window' });
  }

  const today = todayBusiness(now);
  const monday = validWeekStart(today, today);
  const supabase = createSupabaseAdminClient();
  const input = await loadWeekInput(supabase, monday, today, nowClockBusiness(now));

  // The engine sees the whole week, so hours and availability are counted correctly. Only the
  // Thursday to Sunday rows that are open are written back.
  const result = assignWeek(input.parties, input.hosts, input.history, input.settings, input.offers);
  const proposed = new Map(result.assignments.map((a) => [a.partyId, a.hostId]));
  const days = new Set(autoRunDays(monday));

  let saved = 0;
  let kept = 0;
  let failed = 0;
  for (const p of input.parties) {
    if (p.fixed || !days.has(p.date)) continue;
    const target = proposed.get(p.id) ?? null;
    // No eligible host: leave the party as it is rather than clearing it.
    if (target === null) {
      kept += 1;
      continue;
    }
    if (target === p.assignedHost) continue;
    const { error } = await supabase.from('parties').update({ assigned_host: target }).eq('id', Number(p.id));
    if (error) failed += 1;
    else saved += 1;
  }

  return NextResponse.json({ ran: true, week: monday, saved, kept, failed });
}
