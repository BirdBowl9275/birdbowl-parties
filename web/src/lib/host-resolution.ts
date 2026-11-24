// Which host a party keeps after an assignment run. Pure, so it is unit tested. Used by the save
// action and by the preview, so the saved result matches what the manager reviewed.

// The engine's proposal wins. If it proposes no host, the party keeps its current host, but only
// while that person is still eligible. Without this, an unlocked party the engine cannot cover is
// cleared, and it shows as uncovered.
export function resolveHost(
  proposed: string | null,
  current: string | null,
  eligible: ReadonlySet<string>,
): string | null {
  if (proposed !== null) return proposed;
  return current !== null && eligible.has(current) ? current : null;
}
