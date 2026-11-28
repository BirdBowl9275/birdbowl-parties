'use client';

import { useState, type ReactNode } from 'react';
import { saveWeekAssignments } from '../actions';

const RED = '#b3261e';
const GREEN = '#1f7a46';

// One form for the whole week: every host and lock change on the page, saved with one button. The
// button is red while there are unsaved changes, and turns green once the save has gone through.
// Viewers (readOnly) get the rows without a form.
export function WeekAssignForm({
  week,
  readOnly,
  justSaved,
  children,
}: {
  week: string;
  readOnly: boolean;
  justSaved: boolean;
  children: ReactNode;
}) {
  const [edited, setEdited] = useState(false);
  if (readOnly) return <>{children}</>;
  const saved = justSaved && !edited;
  const color = saved ? GREEN : RED;
  const text = saved ? 'Saved' : edited ? 'Save changes' : 'Save schedule';
  return (
    <form action={saveWeekAssignments} onChange={() => setEdited(true)}>
      <input type="hidden" name="week" value={week} />
      {children}
      <div className="week-save" style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0' }}>
        <button type="submit" className="btn-secondary" style={{ background: color, borderColor: color, color: '#fff', padding: '10px 18px' }}>
          {text}
        </button>
      </div>
    </form>
  );
}
