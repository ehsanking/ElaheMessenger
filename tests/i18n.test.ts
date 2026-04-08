import { describe, it, expect } from 'vitest';
import { resolveLocale, isRtl, getDirection, locales, defaultLocale, localeNames } from '@/lib/i18n/config';
import messages from '@/lib/i18n/messages';

/**
 * Tests for the i18n configuration and message dictionaries.
 */

describe('i18n Configuration', () => {
  it('should have a default locale', () => {
    expect(defaultLocale).toBe('en');
  });

  it('should list all supported locales', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('fa');
    expect(locales).toContain('ar');
    expect(locales.length).toBeGreaterThanOrEqual(3);
  });

  it('should have names for all locales', () => {
    for (const locale of locales) {
      expect(localeNames[locale]).toBeTruthy();
    }
  });

  it('should identify RTL locales correctly', () => {
    expect(isRtl('fa')).toBe(true);
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl('pt')).toBe(false);
  });

  it('should return correct direction', () => {
    expect(getDirection('fa')).toBe('rtl');
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
    expect(getDirection('zh')).toBe('ltr');
  });
});

describe('resolveLocale', () => {
  it('should resolve from cookie first', () => {
    expect(resolveLocale('fa', 'en')).toBe('fa');
  });

  it('should fall back to Accept-Language header', () => {
    expect(resolveLocale(null, 'fa-IR,en;q=0.5')).toBe('fa');
    expect(resolveLocale(null, 'ar,en;q=0.5')).toBe('ar');
  });

  it('should fall back to default locale', () => {
    expect(resolveLocale(null, null)).toBe('en');
    expect(resolveLocale(null, 'xx-XX')).toBe('en');
  });

  it('should ignore invalid cookie values', () => {
    expect(resolveLocale('xx', null)).toBe('en');
  });
});

describe('i18n Messages', () => {
  it('should have messages for all locales', () => {
    for (const locale of locales) {
      expect(messages[locale]).toBeDefined();
    }
  });

  it('should have the same top-level keys in all locales', () => {
    const enKeys = Object.keys(messages.en).sort();
    for (const locale of locales) {
      const localeKeys = Object.keys(messages[locale]).sort();
      expect(localeKeys).toEqual(enKeys);
    }
  });

  it('should have the same nested keys in all locales', () => {
    const sections = Object.keys(messages.en) as (keyof typeof messages.en)[];
    for (const section of sections) {
      const enKeys = Object.keys(messages.en[section]).sort();
      for (const locale of locales) {
        const localeKeys = Object.keys(messages[locale][section]).sort();
        expect(localeKeys).toEqual(enKeys);
      }
    }
  });

  it('should not have empty translation values', () => {
    for (const locale of locales) {
      const sections = Object.keys(messages[locale]) as (keyof typeof messages[typeof locale])[];
      for (const section of sections) {
        const sectionObj = messages[locale][section] as Record<string, string>;
        for (const [key, value] of Object.entries(sectionObj)) {
          expect(value, `Empty translation: ${locale}.${section}.${key}`).toBeTruthy();
        }
      }
    }
  });
});
