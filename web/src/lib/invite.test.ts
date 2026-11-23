import { describe, expect, it } from 'vitest';
import { validateInvite } from './invite';

describe('validateInvite', () => {
  it('normalises email and name', () => {
    expect(validateInvite({ email: '  Dion@BirdBowl.com ', fullName: '  Dion   Smith ' })).toEqual({
      ok: true,
      value: { email: 'dion@birdbowl.com', fullName: 'Dion Smith' },
    });
  });

  it('rejects a missing or malformed email', () => {
    expect(validateInvite({ email: '', fullName: 'A' }).ok).toBe(false);
    expect(validateInvite({ email: 'not-an-email', fullName: 'A' }).ok).toBe(false);
    expect(validateInvite({ email: 'a b@c.com', fullName: 'A' }).ok).toBe(false);
  });

  it('requires a name of sensible length', () => {
    expect(validateInvite({ email: 'a@b.com', fullName: '   ' }).ok).toBe(false);
    expect(validateInvite({ email: 'a@b.com', fullName: 'x'.repeat(101) }).ok).toBe(false);
  });
});
