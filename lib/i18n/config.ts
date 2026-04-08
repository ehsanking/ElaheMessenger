/**
 * Internationalization (i18n) configuration.
 *
 * Defines supported locales, their directionality (LTR/RTL),
 * and helpers for resolving the active locale from cookies or
 * the Accept-Language header.
 */

export const LOCALES = [
  'en', 'fa', 'ar', 'de', 'es', 'pt', 'ru', 'zh', 'tr', 'th', 'sv', 'da',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Locales that use right-to-left script direction. */
const RTL_LOCALES: ReadonlySet<string> = new Set<Locale>(['fa', 'ar']);

/** Display names for the locale picker UI. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fa: 'فارسی',
  ar: 'العربية',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  tr: 'Türkçe',
  th: 'ไทย',
  sv: 'Svenska',
  da: 'Dansk',
};

/** Return 'rtl' or 'ltr' based on the given locale. */
export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

/**
 * Check whether a value is a supported locale string.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve the active locale from:
 *  1. An explicit cookie value (e.g. `elahe_locale`)
 *  2. The Accept-Language header
 *  3. The DEFAULT_LOCALE fallback
 */
export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  // 1. Cookie takes highest priority
  if (cookieValue && isLocale(cookieValue)) return cookieValue;

  // 2. Parse Accept-Language header for a match
  if (acceptLanguage) {
    // Accept-Language format: en-US,en;q=0.9,fa;q=0.8
    const parts = acceptLanguage
      .split(',')
      .map((p) => p.trim().split(';')[0].split('-')[0].trim().toLowerCase());
    for (const part of parts) {
      if (isLocale(part)) return part;
    }
  }

  return DEFAULT_LOCALE;
}
