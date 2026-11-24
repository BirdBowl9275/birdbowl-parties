'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition, type ReactNode } from 'react';

// Admin → Users keeps one form per person (so each row still saves on its own, with the remove
// confirm). This wrapper tracks which rows have unsaved edits and offers "Save all changes".

type RowEntry = { form: HTMLFormElement };

type EditorApi = {
  setRowDirty: (id: string, entry: RowEntry | null) => void;
  discardToken: number;
};

const EditorContext = createContext<EditorApi | null>(null);

export function useUsersEditor() {
  return useContext(EditorContext);
}

const FIELDS = ['id', 'role', 'status', 'tier'] as const;

export function UsersEditor({
  action,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const rows = useRef(new Map<string, RowEntry>());
  const [count, setCount] = useState(0);
  const [discardToken, setDiscardToken] = useState(0);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const setRowDirty = useCallback((id: string, entry: RowEntry | null) => {
    if (entry) rows.current.set(id, entry);
    else rows.current.delete(id);
    setCount(rows.current.size);
    setError('');
  }, []);

  const api = useMemo(() => ({ setRowDirty, discardToken }), [setRowDirty, discardToken]);

  function saveAll() {
    const entries = [...rows.current.values()];
    // Same rule as the server: anyone set to Removed (new or existing) is saved on their own row.
    if (entries.some((e) => new FormData(e.form).get('status') === 'removed')) {
      setError("Rows set to Removed are saved one at a time. Use Save on that person's row.");
      return;
    }
    const fd = new FormData();
    for (const { form } of entries) {
      const data = new FormData(form);
      for (const name of FIELDS) fd.append(name, String(data.get(name) ?? ''));
    }
    setError('');
    startTransition(() => action(fd));
  }

  function discard() {
    setDiscardToken((t) => t + 1);
  }

  const label = count === 1 ? '1 user has unsaved changes' : `${count} users have unsaved changes`;

  return (
    <EditorContext.Provider value={api}>
      {children}
      <div className="save-all-bar" hidden={count === 0}>
        <p className="save-all-text">{error || label}</p>
        <div className="save-all-actions">
          <button type="button" className="btn-secondary" onClick={discard} disabled={pending}>
            Discard
          </button>
          <button type="button" onClick={saveAll} disabled={pending} aria-busy={pending}>
            {pending ? 'Saving…' : 'Save all changes'}
          </button>
        </div>
      </div>
      {/* Always present so screen readers hear the count change. */}
      <p className="vh" role="status" aria-live="polite">
        {count > 0 ? error || label : ''}
      </p>
    </EditorContext.Provider>
  );
}
