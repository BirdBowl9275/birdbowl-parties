import { describe, expect, it } from 'vitest';
import { DUPLICATE_KEY, needsAvailabilityFirst } from './availability-submission';

describe('needsAvailabilityFirst', () => {
  it('sends a staff member to availability when the week is open and nothing was submitted', () => {
    expect(needsAvailabilityFirst({ locked: false, submitted: false })).toBe(true);
  });

  it('does not send them back once a submission is recorded, even if it has no windows', () => {
    expect(needsAvailabilityFirst({ locked: false, submitted: true })).toBe(false);
  });

  it('does not send them to availability once the week is locked', () => {
    expect(needsAvailabilityFirst({ locked: true, submitted: false })).toBe(false);
    expect(needsAvailabilityFirst({ locked: true, submitted: true })).toBe(false);
  });

  it('uses the Postgres unique-violation code', () => {
    expect(DUPLICATE_KEY).toBe('23505');
  });
});
