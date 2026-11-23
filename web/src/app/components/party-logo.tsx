// The Parties mark: a birthday cake whose candles are three bowling pins, on a Bird Bowl red tile.
// Chosen by Jeff (option D, 2026-11-23). Decorative by default: the app name is always shown
// next to it, so screen readers get the name from the text, not from the image.
export const PARTY_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#D7002A"/><rect x="11" y="36" width="42" height="17" rx="4.5" fill="#fff"/><path d="M11 40.5 Q16.25 46 21.5 40.5 Q26.75 46 32 40.5 Q37.25 46 42.5 40.5 Q47.75 46 53 40.5 V38.5 H11 Z" fill="#FFD166"/><g fill="#D7002A"><circle cx="18" cy="48" r="1.3"/><circle cx="27" cy="49.5" r="1.3"/><circle cx="37" cy="48.5" r="1.3"/><circle cx="46" cy="49.5" r="1.3"/></g><g fill="#fff"><path d="M20.5 35.5C19 31.5 19.4 27.5 20.4 25.4C19.4 23.9 19.7 21.3 20.9 20.3C22.1 21.3 22.4 23.9 21.4 25.4C22.4 27.5 22.8 31.5 21.3 35.5Z"/><path d="M31.5 35.5C29.9 30.5 30.3 25.6 31.4 23.4C30.3 21.8 30.7 19.1 32 18C33.3 19.1 33.7 21.8 32.6 23.4C33.7 25.6 34.1 30.5 32.5 35.5Z"/><path d="M42.7 35.5C41.2 31.5 41.6 27.5 42.6 25.4C41.6 23.9 41.9 21.3 43.1 20.3C44.3 21.3 44.6 23.9 43.6 25.4C44.6 27.5 45 31.5 43.5 35.5Z"/></g><g fill="#D7002A"><rect x="19.9" y="26.8" width="2" height="1.4" rx=".5"/><rect x="31" y="25" width="2" height="1.4" rx=".5"/><rect x="42.1" y="26.8" width="2" height="1.4" rx=".5"/></g><g fill="#FFD166"><path d="M20.9 18.6C19.6 16.7 20.9 13.8 20.9 13.8S22.2 16.7 20.9 18.6Z"/><path d="M32 16.3C30.7 14.4 32 11.5 32 11.5S33.3 14.4 32 16.3Z"/><path d="M43.1 18.6C41.8 16.7 43.1 13.8 43.1 13.8S44.4 16.7 43.1 18.6Z"/></g></svg>`;

export function PartyLogo({ size }: { size: number }) {
  return (
    <span
      className="party-logo"
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PARTY_LOGO_SVG }}
    />
  );
}
