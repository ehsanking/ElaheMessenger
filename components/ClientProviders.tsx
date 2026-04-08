'use client';

import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import type { Locale } from '@/lib/i18n/config';

/**
 * Client-side provider wrapper.
 *
 * Wraps the application with i18n and theme providers so that all
 * client components have access to locale, direction, and theme context.
 */
export function ClientProviders({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  return (
    <ThemeProvider>
      <I18nProvider initialLocale={initialLocale}>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
}
