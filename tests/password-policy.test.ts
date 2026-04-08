import { describe, it, expect } from 'vitest';

/**
 * Tests for the password policy module.
 */

import { isPasswordPolicyCompliant, PASSWORD_POLICY_MESSAGE } from '@/lib/password-policy';

describe('Password Policy', () => {
  it('should accept a strong password', () => {
    expect(isPasswordPolicyCompliant('Str0ng!Pass')).toBe(true);
    expect(isPasswordPolicyCompliant('MyP@ssw0rd')).toBe(true);
    expect(isPasswordPolicyCompliant('C0mpl3x!ty')).toBe(true);
  });

  it('should reject passwords shorter than 8 characters', () => {
    expect(isPasswordPolicyCompliant('Ab1!xyz')).toBe(false);
    expect(isPasswordPolicyCompliant('A1!b')).toBe(false);
  });

  it('should reject passwords without uppercase letters', () => {
    expect(isPasswordPolicyCompliant('lowercase1!')).toBe(false);
  });

  it('should reject passwords without lowercase letters', () => {
    expect(isPasswordPolicyCompliant('UPPERCASE1!')).toBe(false);
  });

  it('should reject passwords without digits', () => {
    expect(isPasswordPolicyCompliant('NoDigits!')).toBe(false);
  });

  it('should reject passwords without special characters', () => {
    expect(isPasswordPolicyCompliant('NoSpecial1')).toBe(false);
  });

  it('should expose a human-readable policy message', () => {
    expect(PASSWORD_POLICY_MESSAGE).toBeTruthy();
    expect(typeof PASSWORD_POLICY_MESSAGE).toBe('string');
    expect(PASSWORD_POLICY_MESSAGE.length).toBeGreaterThan(10);
  });

  it('should reject empty strings and whitespace', () => {
    expect(isPasswordPolicyCompliant('')).toBe(false);
    expect(isPasswordPolicyCompliant('   ')).toBe(false);
  });
});
