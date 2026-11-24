import type { Metadata } from 'next';
import { requireManager } from '@/lib/manager-guard';
import { importRoster } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'HotSchedules roster' };

// Fixed texts only. A message code from the URL maps to one of these; anything else shows nothing.
const MESSAGES: Record<string, string> = {
  choose_file: 'Choose a CSV file first.',
  file_too_large: 'That file is too large. Export one week at a time.',
  missing_columns: 'The file is missing columns. It needs an Employee or Name column, and either Day Shift and Day Job columns, or Date, Job, Start and End columns. The Phone column is not used.',
  missing_week_start: 'Enter the Monday that starts the week in the file.',
  week_not_valid: 'The week start date is not valid.',
  week_not_monday: 'The week must start on a Monday.',
  too_many_rows: 'The file has too many rows. Export one week at a time.',
  empty_file: 'The file is empty.',
  import_stopped: 'The import stopped partway. Run it again. Importing the same file twice is safe.',
  import_failed: 'Could not read the staff list. Try again.',
  import_saved: 'Roster saved.',
};

type Search = { msg?: string; imported?: string; skipped?: string; invalid?: string; discarded?: string; code?: string };

// Manager only. Upload the HotSchedules weekly roster. It is stored for conflict checks and hour
// totals. The app never assigns anyone from it.
export default async function RosterPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireManager();
  const sp = await searchParams;
  const text = sp.msg ? MESSAGES[sp.msg] : undefined;
  const saved = sp.msg === 'import_saved';
  // Database error code only (no row data). Shown so the cause can be found.
  const code = sp.code && /^[A-Za-z0-9]{1,12}$/.test(sp.code) ? sp.code : null;

  return (
    <section aria-labelledby="roster-title">
      <h1 id="roster-title">HotSchedules roster</h1>
      <p className="muted">
        Upload the weekly roster exported from HotSchedules as a CSV. It is used for conflict checks and hour
        totals only. The Phone column is never read.
      </p>

      {text ? (
        <p role="status" className={saved ? 'banner banner-success' : 'banner banner-danger'}>
          {text}
          {code ? ` Database error code: ${code}.` : ''}
        </p>
      ) : null}

      {saved ? (
        <ul className="muted">
          <li>Shifts saved: {sp.imported ?? '0'}</li>
          <li>Rows with other jobs, skipped: {sp.skipped ?? '0'}</li>
          <li>Rows that could not be read, skipped: {sp.invalid ?? '0'}</li>
          <li>
            Discarded, no exact match to an active account: {sp.discarded ?? '0'}. Only exact name matches are
            kept.
          </li>
        </ul>
      ) : null}

      <form action={importRoster} encType="multipart/form-data">
        <label htmlFor="roster-file">Roster CSV</label>
        <label htmlFor="roster-week">Week starts on (Monday)</label>
        <input id="roster-week" name="week_start" type="date" required />
        <p className="muted">Needed for the weekly export, which has no dates. Use the Monday of the week in the file.</p>
        <label htmlFor="roster-file">Roster CSV</label>
        <input id="roster-file" name="roster" type="file" accept=".csv,text/csv" required />
        <button type="submit">Upload roster</button>
      </form>
    </section>
  );
}
