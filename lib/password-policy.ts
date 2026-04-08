/**
 * Password policy validation.
 *
 * Improvements:
 * - Allows broader set of special characters (not limited to @$!%*?&).
 * - Configurable minimum length via PASSWORD_MIN_LENGTH env variable.
 * - Provides individual failure reasons for better UX.
 * - Rejects common/breached passwords.
 */

const MIN_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH) || 8;
const MAX_LENGTH = 128;

const COMMON_PASSWORDS = new Set([
  'password', 'password1', '12345678', '123456789', 'qwerty123',
  'abc12345', 'letmein1', 'welcome1', 'admin123', 'changeme',
  'password123', 'iloveyou', '11111111', '00000000',
]);

export type PasswordPolicyResult = {
  valid: boolean;
  errors: string[];
};

export const PASSWORD_POLICY_MESSAGE =
  `Password must be at least ${MIN_LENGTH} characters long and include uppercase, lowercase, number, and a special character.`;

export const validatePassword = (password: string): PasswordPolicyResult => {
  const errors: string[] = [];

  if (!password || password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long.`);
  }

  if (password.length > MAX_LENGTH) {
    errors.push(`Password must not exceed ${MAX_LENGTH} characters.`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  if (!/[^A-Za-z\d\s]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password.');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Backward-compatible check that returns a simple boolean.
 */
export const isPasswordPolicyCompliant = (password: string) => validatePassword(password).valid;
