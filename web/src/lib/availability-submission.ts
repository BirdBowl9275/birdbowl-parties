// Rules for the "submitted" marker that records a week's availability was sent, even when no
// time windows were entered. Pure, so they are unit tested.

// Staff are sent to the availability page only while the week is still open and no submission
// has been recorded for it. A saved empty week counts as submitted.
export function needsAvailabilityFirst(input: { locked: boolean; submitted: boolean }): boolean {
  return !input.locked && !input.submitted;
}

// Postgres unique_violation. A second submission for the same week is already recorded, so it is
// treated as success.
export const DUPLICATE_KEY = '23505';
