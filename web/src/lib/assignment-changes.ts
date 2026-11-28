// Which party rows changed on the manager schedule, so one Save button saves only those. Pure, so
// it is unit tested. A row is changed when its host or its lock differs from the database.

export type SavedParty = { id: number; assigned_host: string | null; assignment_locked: boolean };
export type PostedRow = { host: string | null; locked: boolean };

export function changedPartyIds(current: SavedParty[], posted: Map<number, PostedRow>): number[] {
  const changed: number[] = [];
  for (const p of current) {
    const row = posted.get(p.id);
    if (!row) continue; // not on the form (for example a read-only row)
    if (row.host !== p.assigned_host || row.locked !== p.assignment_locked) changed.push(p.id);
  }
  return changed;
}
