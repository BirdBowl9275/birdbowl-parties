import logo from '../brand-logo-128.png';
import { ThemeToggle } from './theme-toggle';

// Shared shell for the signed-out screens (login) and the not-yet-approved screen (pending).
// The site header renders nothing on these screens, so the card carries the brand.
export function AuthCard({
  titleId,
  title,
  children,
}: {
  titleId: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="auth-card" aria-labelledby={titleId}>
      <div className="auth-brand">
        <span className="auth-brand-id">
          <img src={logo.src} width={48} height={48} alt="" />
          <span>Bird Bowl Parties</span>
        </span>
        <ThemeToggle />
      </div>
      <h1 id={titleId}>{title}</h1>
      {children}
    </section>
  );
}
