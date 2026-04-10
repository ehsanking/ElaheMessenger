import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import PwaPromptClient from '@/components/PwaPromptClient';
import { ClientProviders } from '@/components/ClientProviders';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { resolveLocale, getDirection } from '@/lib/i18n/config';
import type { Locale } from '@/lib/i18n/config';

// Modern variable fonts (self-hosted via the `geist` package).
// Persian/Arabic falls back to Vazirmatn / Tahoma via the CSS font stack.
const geistSans = GeistSans;
const geistMono = GeistMono;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0b12' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://elahe.example'),
  title: {
    default: 'Elahe Messenger — Private. Encrypted. Yours.',
    template: '%s · Elahe Messenger',
  },
  description:
    'Privacy-first, self-hosted end-to-end encrypted messenger. Own your data, your keys, and your conversations.',
  applicationName: 'Elahe Messenger',
  keywords: [
    'private messenger',
    'end-to-end encryption',
    'self-hosted chat',
    'E2EE',
    'secure messaging',
    'open source',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    title: 'Elahe Messenger',
    description:
      'Privacy-first, self-hosted end-to-end encrypted messenger. Own your data.',
    siteName: 'Elahe Messenger',
    images: ['/readme-banner.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elahe Messenger',
    description: 'Private, encrypted, self-hosted messaging.',
    images: ['/readme-banner.png'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const localeCookie = cookieStore.get('elahe_locale')?.value ?? null;
  const acceptLang = headerStore.get('accept-language') ?? null;
  const cspNonce = headerStore.get('x-csp-nonce') ?? undefined;
  const locale = resolveLocale(localeCookie, acceptLang) as Locale;
  const direction = getDirection(locale);

  const fontVars = `${geistSans.variable} ${geistMono.variable}`;

  return (
    <html
      lang={locale}
      dir={direction}
      className={fontVars}
      suppressHydrationWarning
    >
      {/* Inline script to prevent FOUC (flash of unstyled content) for dark mode */}
      <head>
        <script nonce={cspNonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('elahe_theme') || (document.cookie.match(/elahe_theme=([^;]+)/)||[])[1];
                  var theme = t || 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.add(resolved);
                  document.documentElement.style.colorScheme = resolved;
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-soft)]"
      >
        <ClientProviders initialLocale={locale}>
          {children}
          <PwaPromptClient />
          <ServiceWorkerRegister />
        </ClientProviders>
      </body>
    </html>
  );
}
