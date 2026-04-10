'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import GoogleRecaptcha from '@/components/auth/google-recaptcha';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import LanguageSelector from '@/components/LanguageSelector';

type PublicSettings = {
  isCaptchaEnabled: boolean;
  captchaProvider?: 'recaptcha' | 'local' | string;
  recaptchaSiteKey: string | null;
  localCaptcha?: { prompt: string; captchaId: string } | null;
  oauthProviders?: { google: boolean; github: boolean; oidc: boolean };
};

const toFriendlyError = (error: unknown) => {
  const message =
    typeof error === 'string' ? error : 'Sign-in failed. Please try again.';
  if (/invalid|incorrect|wrong/i.test(message))
    return 'Your username or password is incorrect.';
  if (/captcha/i.test(message))
    return 'Please complete the security check and try again.';
  if (/challenge|expired|missing/i.test(message))
    return 'Your verification step expired. Please sign in again.';
  if (/rate|too many/i.test(message))
    return 'Too many attempts. Please wait a moment and try again.';
  return message;
};

type LoginPageClientProps = {
  nextPath: string;
};

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [pending2FAUserId, setPending2FAUserId] = useState('');
  const [pending2FAChallengeId, setPending2FAChallengeId] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [localCaptchaAnswer, setLocalCaptchaAnswer] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [phaseMessage, setPhaseMessage] = useState(
    'Enter your username and password.',
  );
  const [publicSettings, setPublicSettings] = useState<PublicSettings>({
    isCaptchaEnabled: false,
    captchaProvider: 'recaptcha',
    recaptchaSiteKey: null,
    localCaptcha: null,
    oauthProviders: { google: false, github: false, oidc: false },
  });
  const router = useRouter();

  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const response = await fetch('/api/settings/public', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.success && data?.settings) {
          setPublicSettings({
            isCaptchaEnabled: Boolean(data.settings.isCaptchaEnabled),
            captchaProvider: data.settings.captchaProvider,
            recaptchaSiteKey:
              typeof data.settings.recaptchaSiteKey === 'string'
                ? data.settings.recaptchaSiteKey
                : null,
            localCaptcha: data.settings.localCaptcha ?? null,
            oauthProviders: {
              google: Boolean(data.settings.oauthProviders?.google),
              github: Boolean(data.settings.oauthProviders?.github),
              oidc: Boolean(data.settings.oauthProviders?.oidc),
            },
          });
        }
      } catch {
        // ignore
      }
    };
    loadPublicSettings();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setPhaseMessage('Checking your sign-in details…');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          captchaToken:
            publicSettings.captchaProvider === 'local'
              ? localCaptchaAnswer
              : captchaToken,
          captchaId:
            publicSettings.captchaProvider === 'local'
              ? publicSettings.localCaptcha?.captchaId
              : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(toFriendlyError(data.error));
        setPhaseMessage('Enter your username and password.');
      } else if (data.requires2FA) {
        if (!data.challengeId) {
          setError('Could not start 2-step verification. Please sign in again.');
          setPhaseMessage('Enter your username and password.');
          return;
        }
        setPending2FAUserId(data.userId ?? '');
        setPending2FAChallengeId(data.challengeId);
        setShow2FA(true);
        setPhaseMessage('Step 2 of 2: Enter your 6-digit code.');
      } else {
        router.replace(nextPath || '/chat');
      }
    } catch {
      setError('Sign-in is temporarily unavailable. Please try again.');
      setPhaseMessage('Enter your username and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/2fa', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pending2FAUserId,
          token: totpCode,
          challengeId: pending2FAChallengeId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const safeError = toFriendlyError(data.error);
        setError(safeError);
        if (/expired|challenge|missing/i.test(safeError)) {
          setShow2FA(false);
          setPending2FAChallengeId('');
          setPending2FAUserId('');
          setPhaseMessage(
            'Your verification session expired. Please sign in again.',
          );
        }
      } else if (data.success) {
        router.replace(nextPath || '/chat');
      }
    } catch {
      setError('Could not verify your code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-12">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-60 dark:opacity-35" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-50 dark:opacity-20" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 px-3 py-2 text-xs font-medium text-[var(--text-secondary)] backdrop-blur hover:text-[var(--text-primary)] sm:left-6 sm:top-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Home
      </Link>

      <div
        className="glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-7 sm:p-9"
        style={{ animation: 'var(--animate-scale-in)' }}
      >
        {/* Header controls */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.png"
                alt="Elahe Messenger"
                fill
                sizes="32px"
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Elahe <span className="text-gradient-brand">Messenger</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggleButton />
          </div>
        </div>

        {show2FA && pending2FAChallengeId ? (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-inner">
                <KeyRound className="h-6 w-6 text-[var(--color-brand-gold)]" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Two-step verification</h2>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Enter the 6-digit code from your authenticator app.
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{phaseMessage}</p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div>
                <label className="sr-only">Verification code</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/80 px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] text-[var(--text-primary)] backdrop-blur transition-colors focus:border-[var(--accent)] focus:outline-none"
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoFocus
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className="btn-modern flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--accent-soft)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Verify &amp; continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setShow2FA(false);
                setTotpCode('');
                setError('');
                setPhaseMessage('Enter your username and password.');
              }}
              className="mt-4 w-full text-center text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              ← Back to sign in
            </button>
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-inner">
                <Shield className="h-6 w-6 text-[var(--success)]" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Sign in to your encrypted account.
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{phaseMessage}</p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handleLogin} className="space-y-4">
              <FloatingField
                id="login-username"
                label="Username"
                value={username}
                onChange={setUsername}
                required
                disabled={isLoading}
                autoComplete="username"
                placeholder="e.g. ehsanking"
              />

              <div className="space-y-1.5">
                <div className="relative">
                  <FloatingField
                    id="login-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
                        disabled={isLoading}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/auth/recover"
                    className="text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isLoading ||
                  (publicSettings.isCaptchaEnabled &&
                    ((publicSettings.captchaProvider === 'local' &&
                      !localCaptchaAnswer.trim()) ||
                      (publicSettings.captchaProvider !== 'local' && !captchaToken)))
                }
                className="btn-modern flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--accent-soft)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in securely
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {publicSettings.isCaptchaEnabled &&
                publicSettings.captchaProvider === 'recaptcha' &&
                publicSettings.recaptchaSiteKey && (
                  <GoogleRecaptcha
                    siteKey={publicSettings.recaptchaSiteKey}
                    onTokenChange={setCaptchaToken}
                    disabled={isLoading}
                  />
                )}
              {publicSettings.isCaptchaEnabled &&
                publicSettings.captchaProvider === 'local' &&
                publicSettings.localCaptcha && (
                  <div className="space-y-2">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Security check: {publicSettings.localCaptcha.prompt}
                    </p>
                    <input
                      type="text"
                      value={localCaptchaAnswer}
                      onChange={(e) => setLocalCaptchaAnswer(e.target.value)}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/80 px-4 py-3 text-sm text-[var(--text-primary)] backdrop-blur focus:border-[var(--accent)] focus:outline-none"
                      placeholder="Type your answer"
                      required
                    />
                  </div>
                )}
            </form>

            {(publicSettings.oauthProviders?.google ||
              publicSettings.oauthProviders?.github ||
              publicSettings.oauthProviders?.oidc) && (
              <div className="mt-6">
                <div className="relative my-5 flex items-center">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="mx-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    or continue with
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="space-y-2">
                  {publicSettings.oauthProviders?.google && (
                    <OAuthButton
                      href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent('/api/auth/oauth/finalize')}`}
                      label="Continue with Google"
                    />
                  )}
                  {publicSettings.oauthProviders?.github && (
                    <OAuthButton
                      href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent('/api/auth/oauth/finalize')}`}
                      label="Continue with GitHub"
                    />
                  )}
                  {publicSettings.oauthProviders?.oidc && (
                    <OAuthButton
                      href={`/api/auth/signin/oidc?callbackUrl=${encodeURIComponent('/api/auth/oauth/finalize')}`}
                      label="Continue with SSO"
                    />
                  )}
                </div>
              </div>
            )}

            <p className="mt-7 text-center text-sm text-[var(--text-muted)]">
              Don&apos;t have an account?{' '}
              <Link
                href={`/auth/register?next=${encodeURIComponent(nextPath)}`}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Create one
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Local helpers                                                     */
/* ------------------------------------------------------------------ */

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-2xl border border-[color:var(--danger)]/40 bg-[color:var(--danger)]/10 px-4 py-3 text-center text-sm text-[color:var(--danger)]"
    >
      {message}
    </div>
  );
}

type FloatingFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  trailing?: React.ReactNode;
};

function FloatingField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
  autoComplete,
  placeholder,
  trailing,
}: FloatingFieldProps) {
  return (
    <div className="group relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder ?? ' '}
        className="peer w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/80 px-4 pb-2.5 pt-6 text-sm text-[var(--text-primary)] backdrop-blur transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none disabled:opacity-60"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute start-4 top-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]"
      >
        {label}
      </label>
      {trailing && (
        <div className="absolute inset-y-0 end-3 flex items-center">{trailing}</div>
      )}
    </div>
  );
}

function OAuthButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="btn-modern flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/70 py-3 text-sm font-medium text-[var(--text-primary)] backdrop-blur transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)]"
    >
      {label}
    </a>
  );
}
