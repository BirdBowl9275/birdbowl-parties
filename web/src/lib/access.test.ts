import { describe, expect, it } from 'vitest';
import { decideAccess, homePathForRole, isPathAllowed, landingPathFor } from './access';

describe('homePathForRole', () => {
  it('sends each role to its own screen', () => {
    expect(homePathForRole('admin')).toBe('/admin/users');
    expect(homePathForRole('manager')).toBe('/manager/schedule');
    expect(homePathForRole('sales')).toBe('/sales/parties');
    expect(homePathForRole('viewer')).toBe('/manager/schedule');
  });

  it('sends staff to availability first, and anyone with no known role to the staff schedule', () => {
    expect(homePathForRole('staff')).toBe('/app/availability');
    expect(homePathForRole(null)).toBe('/app');
  });
});

describe('decideAccess', () => {
  it('sends a signed-out visitor to login', () => {
    expect(decideAccess({ hasSession: false, profileStatus: null })).toEqual({ kind: 'login' });
  });

  it('ignores a stale profile status when there is no session', () => {
    expect(decideAccess({ hasSession: false, profileStatus: 'active' })).toEqual({ kind: 'login' });
  });

  it('gives no access when the signed-in user has no readable profile', () => {
    expect(decideAccess({ hasSession: true, profileStatus: null })).toEqual({ kind: 'login' });
  });

  it('keeps a pending user on the waiting screen', () => {
    expect(decideAccess({ hasSession: true, profileStatus: 'pending' })).toEqual({ kind: 'pending' });
  });

  it('marks a removed user as removed, not as pending', () => {
    expect(decideAccess({ hasSession: true, profileStatus: 'removed' })).toEqual({ kind: 'removed' });
  });

  it('lets an approved user into the app', () => {
    expect(decideAccess({ hasSession: true, profileStatus: 'active' })).toEqual({ kind: 'app' });
  });
});

describe('landingPathFor', () => {
  it('maps each decision to one landing page', () => {
    expect(landingPathFor({ kind: 'login' })).toBe('/login');
    expect(landingPathFor({ kind: 'removed' })).toBe('/login?reason=removed');
    expect(landingPathFor({ kind: 'pending' })).toBe('/pending');
    expect(landingPathFor({ kind: 'app' })).toBe('/app');
  });
});

describe('isPathAllowed', () => {
  it('keeps a pending user off the app', () => {
    const pending = { kind: 'pending' } as const;
    expect(isPathAllowed(pending, '/pending')).toBe(true);
    expect(isPathAllowed(pending, '/app')).toBe(false);
    expect(isPathAllowed(pending, '/login')).toBe(false);
  });

  it('keeps an approved user out of login and pending', () => {
    const app = { kind: 'app' } as const;
    expect(isPathAllowed(app, '/app')).toBe(true);
    expect(isPathAllowed(app, '/app/anything')).toBe(true);
    expect(isPathAllowed(app, '/pending')).toBe(false);
    expect(isPathAllowed(app, '/login')).toBe(false);
  });

  it('lets an approved user reach the admin area (the page checks the role)', () => {
    expect(isPathAllowed({ kind: 'app' }, '/admin')).toBe(true);
    expect(isPathAllowed({ kind: 'app' }, '/admin/users')).toBe(true);
    expect(isPathAllowed({ kind: 'pending' }, '/admin')).toBe(false);
  });

  it('lets an approved user reach invite (the page checks the role), not pending users', () => {
    expect(isPathAllowed({ kind: 'app' }, '/invite')).toBe(true);
    expect(isPathAllowed({ kind: 'pending' }, '/invite')).toBe(false);
    expect(isPathAllowed({ kind: 'login' }, '/invite')).toBe(false);
  });

  it('does not treat a path prefix as the app', () => {
    expect(isPathAllowed({ kind: 'app' }, '/application')).toBe(false);
  });

  it('lets anyone reach sign-out', () => {
    expect(isPathAllowed({ kind: 'pending' }, '/auth/signout')).toBe(true);
    expect(isPathAllowed({ kind: 'app' }, '/auth/signout')).toBe(true);
  });

  it('only allows login for signed-out and removed visitors', () => {
    expect(isPathAllowed({ kind: 'login' }, '/login')).toBe(true);
    expect(isPathAllowed({ kind: 'removed' }, '/login')).toBe(true);
    expect(isPathAllowed({ kind: 'login' }, '/app')).toBe(false);
  });
});
