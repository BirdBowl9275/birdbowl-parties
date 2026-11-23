export default function Loading() {
  return (
    <div className="loading-skeleton" role="status">
      <span className="vh">Loading…</span>
      <div className="skeleton-line skeleton-title" aria-hidden="true" />
      <div className="skeleton-line" aria-hidden="true" />
      <div className="skeleton-line" aria-hidden="true" />
      <div className="skeleton-line skeleton-short" aria-hidden="true" />
    </div>
  );
}
