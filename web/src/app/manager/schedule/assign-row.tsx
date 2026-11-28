'use client';

import { useState, type ReactNode } from 'react';

const RED = '#b3261e';
const GREEN = '#1f7a46';

// One editable party row on the manager schedule. The Save button is red until the row is saved,
// then green. The page passes savedHere after a successful save of this row. Editing the row again
// turns the button red until the next save.
export function AssignRow({
  action,
  label,
  savedHere,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  savedHere: boolean;
  children: ReactNode;
}) {
  const [edited, setEdited] = useState(false);
  const saved = savedHere && !edited;
  const color = saved ? GREEN : RED;
  const text = saved ? 'Saved' : edited ? 'Save changes' : 'Save';
  return (
    <form action={action} role="row" className="prow" aria-label={label} onChange={() => setEdited(true)}>
      {children}
      <div role="cell" className="pcell pcell-save">
        <button type="submit" className="secondary btn-secondary" style={{ background: color, borderColor: color, color: '#fff' }}>
          {text}
          <span className="vh"> assignment</span>
        </button>
      </div>
    </form>
  );
}
