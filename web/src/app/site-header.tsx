import Link from 'next/link';
import { homePathForRole } from '@/lib/access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HeaderNav, type NavLink } from './components/header-nav';
import { LogOut } from './components/icons';
import { PartyLogo } from './components/party-logo';
import { ThemeToggle } from './components/theme-toggle';

const MY_SCHEDULE: NavLink = { href: '/app', label: 'My schedule' };
const PARTIES: NavLink = { href: '/sales/parties', label: 'Parties' };
const SCHEDULE: NavLink = { href: '/manager/schedule', label: 'Schedule' };
const ROSTER: NavLink = { href: '/manager/roster', label: 'Roster' };
const AVAILABILITY: NavLink = { href: '/manager/availability', label: 'Availability' };
const OVERRIDES: NavLink = { href: '/admin/overrides', label: 'Overrides' };

// Links to screens each role can already open. Display only.
function linksForRole(role: string | null, canOverride: boolean): NavLink[] {
  switch (role) {
    case 'admin':
      return [
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/settings', label: 'Settings' },
        OVERRIDES,
        SCHEDULE,
        ROSTER,
        ...(canOverride ? [AVAILABILITY] : []),
        PARTIES,
        MY_SCHEDULE,
      ];
    case 'manager':
      return [SCHEDULE, ROSTER, ...(canOverride ? [AVAILABILITY] : []), PARTIES, MY_SCHEDULE];
    case 'viewer':
      // Read-only: schedule and parties list. Viewers are not hosts, so no "My schedule".
      return [SCHEDULE, PARTIES];
    default:
      return [MY_SCHEDULE];
  }
}

// Shown only to signed-in, approved people. Login and pending render nothing here because
// there is no session or the profile is not active. Reads only the person's own profile.
export async function SiteHeader() {
  let role: string | null = null;
  let canOverride = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, can_enter_availability')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.status !== 'active') return null;
    role = profile.role as string;
    canOverride = profile.can_enter_availability === true;
  } catch {
    return null;
  }

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-header-inner">
        <Link href={homePathForRole(role)} className="brand-link">
          <PartyLogo size={32} />
          <span>Parties</span>
        </Link>
        <HeaderNav links={linksForRole(role, canOverride)} />
        <div className="site-header-tools">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost">
              <LogOut />
              <span className="vh-md">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
