import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { decideAccess, homePathForRole, isPathAllowed, landingPathFor, type ProfileStatus } from '@/lib/access';

// Runs on every request. It refreshes the session, reads the person's own profile
// status (RLS allows a user to read their own row), and redirects to the right screen.
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse('Supabase is not configured', { status: 500 });
  }

  // The scheduler's cron call has no signed-in user. The route checks its own secret token instead.
  if (request.nextUrl.pathname.startsWith('/api/cron/')) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileStatus: ProfileStatus | null = null;
  let role: string | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('status, role').eq('id', user.id).maybeSingle();
    profileStatus = (data?.status as ProfileStatus | undefined) ?? null;
    role = (data?.role as string | undefined) ?? null;
  }

  const decision = decideAccess({ hasSession: Boolean(user), profileStatus });
  const { pathname } = request.nextUrl;

  if (decision.kind === 'removed') {
    // End the session so the removed person cannot keep a live login cookie.
    await supabase.auth.signOut();
  }

  // An active person who opens the root page goes to the screen for their role.
  // This check must come before the general allowed-path check, which would send '/' to /app.
  if (decision.kind === 'app' && pathname === '/') {
    const redirect = NextResponse.redirect(new URL(homePathForRole(role), request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  if (!isPathAllowed(decision, pathname)) {
    const redirect = NextResponse.redirect(new URL(landingPathFor(decision), request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
