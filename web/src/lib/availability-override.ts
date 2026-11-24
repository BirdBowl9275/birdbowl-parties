// Rules for the manager availability override. Pure, so they are unit tested.
// The database enforces the same rules (migration 0020): the flag must be on, and the person
// must be an active tier-1 hostess. The database is the real protection; these checks give a clear message.

export type TargetRow = { status: string | null; tier: number | null } | null;

// Only an active hostess (tier 1) can have availability entered by a manager.
export function isOverrideTarget(row: TargetRow): boolean {
  return row !== null && row.status === 'active' && row.tier === 1;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
