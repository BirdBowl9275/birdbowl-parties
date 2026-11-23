import type { Tone } from '@/lib/admin-messages';
import { Check, CircleAlert } from './icons';

// A result banner whose text comes from a fixed message table (lib/page-messages.ts).
export function MessageBanner({ banner }: { banner: { tone: Tone; text: string } | null }) {
  if (!banner) return null;
  return banner.tone === 'error' ? (
    <div className="banner banner-danger" role="alert">
      <CircleAlert />
      <span>{banner.text}</span>
    </div>
  ) : (
    <div className="banner banner-success" role="status">
      <Check />
      <span>{banner.text}</span>
    </div>
  );
}
