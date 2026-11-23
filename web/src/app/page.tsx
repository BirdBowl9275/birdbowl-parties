import { redirect } from 'next/navigation';

// Middleware sends each person to the right screen. This is only the entry point.
export default function HomePage() {
  redirect('/app');
}

// Session-dependent page: never prerender.
export const dynamic = 'force-dynamic';
