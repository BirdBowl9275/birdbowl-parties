# Production build check (parent session, 2026-11-23)

Built a temporary copy of the worktree's web/ (excluding .next and node_modules; node_modules linked to the main checkout's install) in $TMPDIR, so the running dev servers on 3200 and 3300 were not touched. Copy deleted afterwards.

`next build` (Next.js 15.5.29): compiled successfully, lint and type checks passed, 4/4 static pages generated, all app routes dynamic as before.

| Route | Size | First load JS |
|---|---|---|
| / | 136 B | 103 kB |
| /admin | 136 B | 103 kB |
| /admin/settings | 136 B | 103 kB |
| /admin/users | 1.83 kB | 105 kB |
| /app | 136 B | 103 kB |
| /auth/signout | 136 B | 103 kB |
| /login | 3.28 kB | 144 kB |
| /manager/schedule | 161 B | 106 kB |
| /pending | 2.35 kB | 143 kB |
| /sales/parties | 1.07 kB | 107 kB |
| Shared | | 103 kB |
| Middleware | 66.4 kB | |

Also: tsc --noEmit clean, vitest 73/73.
