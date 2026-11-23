'use client';

import { useEffect, useId, useRef, useState } from 'react';

// Two-step cancel built on a native disclosure. The confirmation, the form, the action and the
// hidden fields are all in the server-rendered HTML, so before hydration and without JavaScript
// the first press only opens the confirmation; a second, deliberate press ("Yes, cancel party")
// submits. JavaScript only adds focus handling, Escape and the "Keep party" button.
export function CancelParty({
  action,
  id,
  week,
  customer,
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  week: string;
  customer: string;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const textId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setHydrated(true);
    // A confirm opened before hydration is already open in the DOM; pick that up.
    setIsOpen(detailsRef.current?.open ?? false);
  }, []);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
    triggerRef.current?.focus();
  }

  function onToggle() {
    const el = detailsRef.current;
    if (!el) return;
    setIsOpen(el.open);
    if (el.open) {
      // Only one confirm open at a time. Closing the others never moves focus.
      document.querySelectorAll<HTMLDetailsElement>('details.cancel-fold[open]').forEach((d) => {
        if (d !== el) d.open = false;
      });
      keepRef.current?.focus();
    }
  }

  // While open, a click or tap outside closes the confirm. Focus is left where the user put it.
  // This listens for the completed click, not pointerdown: closing on press would shrink the row
  // before the release, so a press on another party's "Cancel party" would land on whatever moved
  // under the pointer and need a second click.
  const pointerDown = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    pointerDown.current = false;
    function onDown() {
      pointerDown.current = true;
    }
    function onUp() {
      pointerDown.current = false;
    }
    function onClick(e: MouseEvent) {
      const el = detailsRef.current;
      if (el && !el.contains(e.target as Node)) el.open = false;
    }
    // Escape works even when focus has fallen to the page body (e.g. after clicking the
    // confirm text). Any key press also clears a pointer flag a context menu may have left set.
    function onKey(e: KeyboardEvent) {
      pointerDown.current = false;
      if (e.key !== 'Escape') return;
      const el = detailsRef.current;
      if (el?.open && !el.contains(document.activeElement)) close();
    }
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('pointercancel', onUp, true);
    document.addEventListener('contextmenu', onUp, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('pointercancel', onUp, true);
      document.removeEventListener('contextmenu', onUp, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onClick);
    };
  }, [isOpen]);

  return (
    <details
      className="cancel-fold"
      ref={detailsRef}
      onToggle={onToggle}
      onBlur={(e) => {
        // Keyboard focus moved to an element outside the confirm: close without stealing focus.
        // Focus moved by a mouse or touch press is left to the click handler above, so the
        // layout does not shift between press and release.
        if (pointerDown.current) return;
        const next = e.relatedTarget as Node | null;
        if (next && detailsRef.current && !detailsRef.current.contains(next)) detailsRef.current.open = false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && detailsRef.current?.open) close();
      }}
    >
      <summary ref={triggerRef} className="btn btn-danger-outline">
        Cancel party<span className="vh"> {customer}</span>
      </summary>
      <form action={action} className="cancel-form">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="week" value={week} />
        <div role="group" aria-labelledby={textId} className="confirm-box">
          <p id={textId} className="confirm-text">
            Cancel this party? This cannot be undone.
            <span className="vh"> Customer: {customer}.</span>
          </p>
          <div className="confirm-actions">
            <button type="submit" className="btn-danger">
              Yes, cancel party
            </button>
            {hydrated ? (
              <button type="button" ref={keepRef} className="btn-secondary" onClick={close}>
                Keep party
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </details>
  );
}
