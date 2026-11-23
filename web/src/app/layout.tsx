import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from './site-header';

export const metadata: Metadata = {
  title: 'Party Hostess Scheduler',
  description: 'Bird Bowl party host schedule',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Runs before first paint so a stored light or dark choice does not flash the other theme.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader />
        <main id="main" className="page">
          {children}
        </main>
      </body>
    </html>
  );
}
