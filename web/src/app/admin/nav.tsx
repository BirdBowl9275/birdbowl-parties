import Link from 'next/link';

export function AdminNav({ current }: { current: 'users' | 'settings' }) {
  return (
    <nav aria-label="Admin" className="admin-nav">
      <Link href="/admin/users" aria-current={current === 'users' ? 'page' : undefined}>Users</Link>
      <Link href="/admin/settings" aria-current={current === 'settings' ? 'page' : undefined}>Settings</Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className="secondary">Sign out</button>
      </form>
    </nav>
  );
}
