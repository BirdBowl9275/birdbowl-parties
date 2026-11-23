import { adminBanner } from '@/lib/admin-messages';
import { Check, CircleAlert } from '../components/icons';

// Result banner for Admin pages. Text comes only from the fixed list in lib/admin-messages.ts.
export function AdminBanner(params: { msg?: string; n?: string; of?: string; none?: string }) {
  const banner = adminBanner(params);
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
