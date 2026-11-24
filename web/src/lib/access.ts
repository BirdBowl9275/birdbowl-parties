// Pure routing rules for sign-in and approval. No I/O, so they can be unit tested.
// The database (RLS) is what actually protects data. These rules only decide
// which screen a person sees.

export type ProfileStatus = 'pending' | 'active' | 'removed';

export type AccessDecision =
  | { kind: 'login' }
  | { kind: 'pending' }
  | { kind: 'removed' }
  | { kind: 'app' };

export function decideAccess(input: {
  hasSession: boolean;
  profileStatus: ProfileStatus | null;
}): AccessDecision {
  if (!input.hasSession) return { kind: 'login' };
  // A signed-in user with no readable profile gets no access.
  if (input.profileStatus === null) return { kind: 'login' };
  switch (input.profileStatus) {
    case 'pending':
      return { kind: 'pending' };
    case 'removed':
      return { kind: 'removed' };
    case 'active':
      return { kind: 'app' };
  }
}

export function landingPathFor(decision: AccessDecision): string {
  switch (decision.kind) {
    case 'login':
      return '/login';
    case 'removed':
      return '/login?reason=removed';
    case 'pending':
      return '/pending';
    case 'app':
      return '/app';
  }
}

// Where an active person goes when they open the root page. Each role starts on its own screen.
// Route-level role checks still decide what they may actually see.
export function homePathForRole(role: string | null): string {
  switch (role) {
    case 'admin':
      return '/admin/users';
    case 'manager':
    case 'viewer':
      return '/manager/schedule';
    // Staff land on their schedule. If next week's availability is not in yet, the schedule
    // page sends them to availability first.
    case 'staff':
      return '/app';
    default:
      return '/app';
  }
}

// Paths a person may open for each decision. Anything else redirects to the landing path.
const ALWAYS_ALLOWED = ['/auth/signout'];

export function isPathAllowed(decision: AccessDecision, pathname: string): boolean {
  if (ALWAYS_ALLOWED.includes(pathname)) return true;
  switch (decision.kind) {
    case 'login':
    case 'removed':
      return pathname === '/login';
    case 'pending':
      return pathname === '/pending';
    case 'app':
      // Route-level role checks (for example, admin-only pages) happen in the pages themselves.
      return (
        pathname === '/app' ||
        pathname.startsWith('/app/') ||
        pathname === '/admin' ||
        pathname.startsWith('/admin/') ||
        pathname === '/sales' ||
        pathname.startsWith('/sales/') ||
        pathname === '/manager' ||
        pathname.startsWith('/manager/') ||
        pathname === '/invite'
      );
  }
}
