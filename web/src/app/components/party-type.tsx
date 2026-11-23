// Party type chip. Database values stay `bowling` and `other`; `other` is shown as "Arcade".
import { BowlingBall, Gamepad2 } from './icons';

export const PARTY_TYPE_LABEL: Record<string, string> = { bowling: 'Bowling', other: 'Arcade' };

export function PartyType({ type }: { type: string | null | undefined }) {
  if (type === 'bowling') {
    return (
      <span className="pill pill-bowling">
        <BowlingBall />
        {PARTY_TYPE_LABEL.bowling}
      </span>
    );
  }
  if (type === 'other') {
    return (
      <span className="pill pill-arcade">
        <Gamepad2 />
        {PARTY_TYPE_LABEL.other}
      </span>
    );
  }
  if (!type) return null;
  return <span className="pill pill-neutral">{type}</span>;
}
