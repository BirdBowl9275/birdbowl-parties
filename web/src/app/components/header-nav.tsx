'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavLink = { href: string; label: string };

// Display only. The pages and the database still decide who may open what.
export function HeaderNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav className="site-nav" aria-label="Main">
      {links.map((l) => {
        const current = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} aria-current={current ? 'page' : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
