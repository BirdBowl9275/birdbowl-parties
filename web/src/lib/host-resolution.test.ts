import { describe, expect, it } from 'vitest';
import { resolveHost } from './host-resolution';

const eligible = new Set(['ana', 'ben']);

describe('resolveHost', () => {
  it('uses the engine proposal when it has one', () => {
    expect(resolveHost('ben', 'ana', eligible)).toBe('ben');
    expect(resolveHost('ben', null, eligible)).toBe('ben');
  });

  it('keeps the current host when the engine proposes none and the host is still eligible', () => {
    expect(resolveHost(null, 'ana', eligible)).toBe('ana');
  });

  it('clears the party when the engine proposes none and the current host is no longer eligible', () => {
    expect(resolveHost(null, 'gone', eligible)).toBeNull();
  });

  it('stays uncovered when there was no current host and the engine proposes none', () => {
    expect(resolveHost(null, null, eligible)).toBeNull();
  });
});
