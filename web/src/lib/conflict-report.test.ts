import { describe, expect, it } from 'vitest';
import { buildConflictReport, type ReportParty } from './conflict-report';

const D = '2026-11-30';
const party = (id: number, start: string, end: string, date = D): ReportParty => ({ id, date, start, end });

describe('buildConflictReport', () => {
  it('lists eligible hosts first, then by priority under 32 hours', () => {
    const report = buildConflictReport({
      parties: [party(1, '14:00', '16:00')],
      hosts: [
        { id: 'a', name: 'Ana' }, // 29 h, under 32, room 3
        { id: 'b', name: 'Bo' },  // 10 h, under 32, room 22: first
        { id: 'c', name: 'Cy' },  // 35 h, at the cap, so ineligible for a 2-hour party
      ],
      shifts: [
        { profileId: 'a', staffName: 'Ana', tier: 1, date: '2026-11-23', start: '08:00', end: '14:00' }, // 6 h
        { profileId: 'a', staffName: 'Ana', tier: 1, date: '2026-11-24', start: '08:00', end: '14:00' }, // 6 h
        { profileId: 'a', staffName: 'Ana', tier: 1, date: '2026-11-25', start: '08:00', end: '14:00' }, // 6 h
        { profileId: 'a', staffName: 'Ana', tier: 1, date: '2026-11-26', start: '08:00', end: '14:00' }, // 6 h
        { profileId: 'a', staffName: 'Ana', tier: 1, date: '2026-11-27', start: '08:00', end: '13:00' }, // 5 h
        { profileId: 'b', staffName: 'Bo', tier: 1, date: '2026-11-23', start: '08:00', end: '18:00' }, // 10 h
        { profileId: 'c', staffName: 'Cy', tier: 1, date: '2026-11-23', start: '08:00', end: '18:00' },
        { profileId: 'c', staffName: 'Cy', tier: 1, date: '2026-11-24', start: '08:00', end: '18:00' },
        { profileId: 'c', staffName: 'Cy', tier: 1, date: '2026-11-25', start: '08:00', end: '18:00' },
        { profileId: 'c', staffName: 'Cy', tier: 1, date: '2026-11-26', start: '08:00', end: '13:00' }, // 35 h total
      ],
      assignments: [],
    });
    const names = report.parties[0].candidates.map((c) => c.name);
    expect(names).toEqual(['Bo', 'Ana', 'Cy']);
  });

  it('marks a host ineligible when a server shift overlaps the party', () => {
    const report = buildConflictReport({
      parties: [party(1, '14:00', '16:00')],
      hosts: [{ id: 'a', name: 'Ana' }],
      shifts: [{ profileId: 'a', staffName: 'Ana', tier: 3, date: D, start: '12:00', end: '15:00' }],
      assignments: [],
    });
    const row = report.parties[0].candidates[0];
    expect(row.eligible).toBe(false);
    expect(row.reasons.join(' ')).toMatch(/server shift/);
  });

  it('applies the 30-minute gap against a party the host already holds', () => {
    const report = buildConflictReport({
      parties: [party(1, '14:00', '18:00'), party(2, '18:15', '20:00')],
      hosts: [{ id: 'a', name: 'Ana' }],
      shifts: [],
      assignments: [{ partyId: 1, hostId: 'a' }],
    });
    const forSecond = report.parties.find((p) => p.party.id === 2)!.candidates[0];
    expect(forSecond.eligible).toBe(false);
    expect(forSecond.reasons.join(' ')).toMatch(/30 minutes/);
  });

  it('lists shifts that did not match an app account', () => {
    const report = buildConflictReport({
      parties: [],
      hosts: [],
      shifts: [{ profileId: null, staffName: 'Dee Server', tier: 3, date: D, start: '09:00', end: '13:00' }],
      assignments: [],
    });
    expect(report.unmatchedShiftNames).toEqual(['Dee Server']);
  });

  it('gives first-of-day arrival only to the earliest party the host holds that day', () => {
    const report = buildConflictReport({
      parties: [party(1, '15:00', '17:00'), party(2, '13:00', '14:00')],
      hosts: [{ id: 'a', name: 'Ana' }],
      shifts: [],
      assignments: [{ partyId: 1, hostId: 'a' }],
    });
    // Party 2 starts earlier than party 1, so party 2 is first of the day: arrival 12:00.
    const forTwo = report.parties.find((p) => p.party.id === 2)!.candidates[0];
    expect(forTwo.arrival).toBe('12:00');
  });
});
