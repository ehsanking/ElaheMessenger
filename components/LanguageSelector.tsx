'use client';

import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LOCALE_LABELS, LOCALES } from '@/lib/i18n/config';

export default function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={`relative inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 text-[var(--text-secondary)] backdrop-blur transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] ${className}`}
    >
      <Languages className="pointer-events-none absolute left-2.5 h-4 w-4" />
      <label className="sr-only">Language</label>
      <select
        aria-label="Select language"
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="h-9 appearance-none rounded-xl bg-transparent pl-8 pr-3 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
      >
        {LOCALES.map((item) => (
          <option key={item} value={item} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            {LOCALE_LABELS[item]}
          </option>
        ))}
      </select>
    </div>
  );
}
