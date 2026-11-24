import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin-guard';
import { saveOverrideFlags } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Availability override' };

// Admin only. Chooses which managers and admins may enter availability for hostesses.
export default async function OverridesPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;

  const { data: rows } = await supabase
    .from('profiles')
    .select('id, full_name, role, can_enter_availability')
    .eq('status', 'active')
    .in('role', ['manager', 'admin'])
    .order('full_name');
  const people = rows ?? [];

  return (
    <section className="card wide" aria-labelledby="overrides-title">
      <h1 id="overrides-title">Availability override</h1>
      <p>
        Tick the managers and admins who may enter availability for an active hostess who did not submit it.
        Everyone else can still view the schedule but cannot enter someone else&apos;s availability.
      </p>

      {sp.msg ? (
        <p role="status" className="muted">
          {sp.msg}
        </p>
      ) : null}

      <form action={saveOverrideFlags}>
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Can enter availability</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id as string}>
                <td>{(p.full_name as string | null) ?? 'Unnamed'}</td>
                <td>{p.role as string}</td>
                <td>
                  <label>
                    <input
                      type="checkbox"
                      name={`flag-${p.id as string}`}
                      defaultChecked={Boolean(p.can_enter_availability)}
                    />
                    <span className="vh">Can enter availability for {(p.full_name as string | null) ?? 'this person'}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit">Save</button>
      </form>
    </section>
  );
}
