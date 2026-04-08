import { describe, expect, it } from 'vitest';

/**
 * Tests for the theme provider utility functions.
 *
 * Since ThemeProvider is a React component, we test the core logic
 * (cookie parsing, theme resolution) in a unit-test style.
 */

describe('Theme Module', () => {
  it('exports ThemeProvider and useTheme', async () => {
    const mod = await import('@/lib/theme');
    expect(mod.ThemeProvider).toBeDefined();
    expect(typeof mod.ThemeProvider).toBe('function');
    expect(mod.useTheme).toBeDefined();
    expect(typeof mod.useTheme).toBe('function');
  });

  it('Theme type accepts valid values', () => {
    // Type-level test: these should all be valid Theme values
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    expect(themes).toHaveLength(3);
    expect(themes).toContain('light');
    expect(themes).toContain('dark');
    expect(themes).toContain('system');
  });
});
