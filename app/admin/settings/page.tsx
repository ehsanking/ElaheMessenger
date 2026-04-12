'use client';

import { useState, useEffect } from 'react';
import {
  getAdminSettings,
  updateAdminSettings,
  updateFileUploadSettings,
  updateFirebaseSettings,
  updateEmailProviderSettings,
  sendTestEmail,
  type UpdateEmailProviderInput,
} from '@/app/actions/admin';
import {
  Save,
  Shield,
  FileText,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Mail,
  Send,
  ChevronDown,
} from 'lucide-react';
import type { EmailProvider } from '@/lib/email';

// ─── Provider metadata ────────────────────────────────────────────────────────

const PROVIDERS: {
  id: EmailProvider;
  label: string;
  badge?: string;
  description: string;
  docsUrl: string;
}[] = [
  {
    id: 'none',
    label: 'Disabled',
    description: 'Email features are turned off.',
    docsUrl: '',
  },
  {
    id: 'brevo',
    label: 'Brevo',
    badge: 'Free tier · recommended',
    description: 'Transactional Email API v3. Free tier: 300 emails/day.',
    docsUrl: 'https://developers.brevo.com/docs/send-a-transactional-email',
  },
  {
    id: 'resend',
    label: 'Resend',
    badge: 'Developer-friendly',
    description: 'Modern email API. Free tier: 3 000 emails/month.',
    docsUrl: 'https://resend.com/docs/introduction',
  },
  {
    id: 'mailgun',
    label: 'Mailgun',
    badge: 'Free limited',
    description: 'Powerful SMTP & REST API. Free: 5 000 emails for 3 months.',
    docsUrl: 'https://documentation.mailgun.com/en/latest/quickstart-sending.html',
  },
  {
    id: 'sendgrid',
    label: 'SendGrid',
    badge: 'Free limited',
    description: 'Twilio SendGrid. Free tier: 100 emails/day.',
    docsUrl: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started',
  },
  {
    id: 'postmark',
    label: 'Postmark',
    badge: 'Paid · high quality',
    description: 'Best deliverability for transactional email. No free tier.',
    docsUrl: 'https://postmarkapp.com/developer/api/overview',
  },
  {
    id: 'smtp',
    label: 'Custom SMTP',
    description: 'Any SMTP server (your own or a third-party relay).',
    docsUrl: '',
  },
];

// ─── Helper components ────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-gold transition-colors ' +
        (props.className ?? '')
      }
    />
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  // General settings
  const [maxSize, setMaxSize] = useState(10);
  const [formats, setFormats] = useState('*');
  const [firebaseConfig, setFirebaseConfig] = useState('');
  const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);
  const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
  const [oauthGoogleEnabled, setOauthGoogleEnabled] = useState(false);
  const [oauthGithubEnabled, setOauthGithubEnabled] = useState(false);
  const [oauthOidcEnabled, setOauthOidcEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState('');
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);

  // Email provider settings
  const [emailProvider, setEmailProvider] = useState<EmailProvider>('none');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailApiKey, setEmailApiKey] = useState('');
  const [emailSmtpHost, setEmailSmtpHost] = useState('');
  const [emailSmtpPort, setEmailSmtpPort] = useState(587);
  const [emailSmtpSecure, setEmailSmtpSecure] = useState(false);
  const [emailSmtpUser, setEmailSmtpUser] = useState('');
  const [emailSmtpPass, setEmailSmtpPass] = useState('');
  const [emailMailgunDomain, setEmailMailgunDomain] = useState('');
  const [emailMailgunRegion, setEmailMailgunRegion] = useState<'us' | 'eu'>('us');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState({ type: '', text: '' });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });
  const [emailConfigured, setEmailConfigured] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const result = await getAdminSettings();
      const { settings } = result;
      if (settings) {
        const s = settings as Record<string, unknown>;
        setMaxSize(settings.maxAttachmentSize / (1024 * 1024));
        setFormats(settings.allowedFileFormats);
        setFirebaseConfig(settings.firebaseConfig || '');
        setIsFirebaseEnabled(!!settings.firebaseConfig && settings.firebaseConfig.length > 10);
        setIsCaptchaEnabled(Boolean(settings.isCaptchaEnabled));
        setOauthGoogleEnabled(Boolean(s.oauthGoogleEnabled));
        setOauthGithubEnabled(Boolean(s.oauthGithubEnabled));
        setOauthOidcEnabled(Boolean(s.oauthOidcEnabled));
        setRecaptchaSiteKey(typeof s.recaptchaSiteKey === 'string' ? s.recaptchaSiteKey : '');
        setRecaptchaSecretKey(typeof s.recaptchaSecretKey === 'string' ? s.recaptchaSecretKey : '');
        setRequireEmailVerification(Boolean(s.requireEmailVerification));

        // Email provider
        setEmailProvider((typeof s.emailProvider === 'string' ? s.emailProvider : 'none') as EmailProvider);
        setEmailFromAddress(typeof s.emailFromAddress === 'string' ? s.emailFromAddress : '');
        setEmailFromName(typeof s.emailFromName === 'string' ? s.emailFromName : '');
        // API keys are encrypted in DB; show placeholder so user knows a value is saved
        setEmailApiKey(typeof s.emailApiKey === 'string' && s.emailApiKey ? '••••••••' : '');
        setEmailSmtpHost(typeof s.emailSmtpHost === 'string' ? s.emailSmtpHost : '');
        setEmailSmtpPort(typeof s.emailSmtpPort === 'number' ? s.emailSmtpPort : 587);
        setEmailSmtpSecure(Boolean(s.emailSmtpSecure));
        setEmailSmtpUser(typeof s.emailSmtpUser === 'string' ? s.emailSmtpUser : '');
        setEmailSmtpPass(typeof s.emailSmtpPass === 'string' && s.emailSmtpPass ? '••••••••' : '');
        setEmailMailgunDomain(typeof s.emailMailgunDomain === 'string' ? s.emailMailgunDomain : '');
        setEmailMailgunRegion(s.emailMailgunRegion === 'eu' ? 'eu' : 'us');
      }
      setEmailConfigured(Boolean((result as Record<string, unknown>).smtpConfigured));
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  // General settings save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    const sizeInBytes = Math.round(maxSize * 1024 * 1024);
    const { success, error } = await updateFileUploadSettings(sizeInBytes, formats);
    const fbResult = await updateFirebaseSettings(isFirebaseEnabled ? firebaseConfig : null);
    const captchaResult = await updateAdminSettings({
      isCaptchaEnabled,
      recaptchaSiteKey: recaptchaSiteKey.trim() || null,
      recaptchaSecretKey: recaptchaSecretKey.trim() || null,
      oauthGoogleEnabled,
      oauthGithubEnabled,
      oauthOidcEnabled,
      requireEmailVerification,
    });

    if (success && !fbResult.error && !captchaResult.error) {
      setMessage({ type: 'success', text: 'Settings updated successfully' });
    } else {
      setMessage({ type: 'error', text: error || fbResult.error || captchaResult.error || 'Failed to update settings' });
    }
    setIsSaving(false);
  };

  // Email provider save
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setEmailMessage({ type: '', text: '' });

    const isPlaceholder = (v: string) => v === '••••••••';

    const input: UpdateEmailProviderInput = {
      provider: emailProvider,
      fromAddress: emailFromAddress,
      fromName: emailFromName,
      // Only send API key / pass if they were actually changed (not still showing placeholder)
      apiKey: isPlaceholder(emailApiKey) ? undefined : emailApiKey || undefined,
      smtpHost: emailSmtpHost,
      smtpPort: emailSmtpPort,
      smtpSecure: emailSmtpSecure,
      smtpUser: emailSmtpUser,
      smtpPass: isPlaceholder(emailSmtpPass) ? undefined : emailSmtpPass || undefined,
      mailgunDomain: emailMailgunDomain,
      mailgunRegion: emailMailgunRegion,
    };

    const result = await updateEmailProviderSettings(input);
    if (result.success) {
      setEmailMessage({ type: 'success', text: 'Email provider saved successfully.' });
      setEmailConfigured(emailProvider !== 'none');
    } else {
      setEmailMessage({ type: 'error', text: result.error || 'Failed to save email settings.' });
    }
    setIsSavingEmail(false);
  };

  // Test email
  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestEmailMessage({ type: '', text: '' });
    const result = await sendTestEmail(testEmailTo);
    if (result.success) {
      setTestEmailMessage({ type: 'success', text: `Test email sent to ${testEmailTo}` });
    } else {
      setTestEmailMessage({ type: 'error', text: result.error || 'Failed to send test email.' });
    }
    setIsSendingTest(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  const selectedProviderMeta = PROVIDERS.find((p) => p.id === emailProvider);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Page header */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="p-3 bg-brand-gold/10 rounded-2xl">
            <Shield className="w-8 h-8 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-zinc-400">Manage system-wide configurations and security limits.</p>
          </div>
        </div>

        {/* ── General settings form ─────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Size Limit */}
            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-brand-gold">
                <HardDrive className="w-5 h-5" />
                <h2 className="font-bold">File Upload Limit</h2>
              </div>
              <p className="text-sm text-zinc-400">Maximum file size for chat attachments.</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={maxSize}
                  onChange={(e) => setMaxSize(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-gold transition-colors"
                  min="1"
                  max="1000"
                />
                <span className="text-zinc-500 font-medium">MB</span>
              </div>
            </div>

            {/* Allowed Formats */}
            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-brand-gold">
                <FileText className="w-5 h-5" />
                <h2 className="font-bold">Allowed Formats</h2>
              </div>
              <p className="text-sm text-zinc-400">Comma-separated extensions or <code className="bg-zinc-800 px-1 rounded">*</code> for all.</p>
              <input
                type="text"
                value={formats}
                onChange={(e) => setFormats(e.target.value)}
                placeholder="e.g. jpg, png, pdf, zip"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-gold transition-colors"
              />
              <p className="text-[10px] text-zinc-500 italic">Example: jpg, png, pdf, docx, zip</p>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-gold">Google reCAPTCHA (Login &amp; Registration)</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-zinc-400">Enable reCAPTCHA</span>
                <input
                  type="checkbox"
                  checked={isCaptchaEnabled}
                  onChange={(e) => setIsCaptchaEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 text-brand-gold focus:ring-brand-gold bg-zinc-950"
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">Configure Google reCAPTCHA v3 for login and registration.</p>
            <input
              type="text"
              value={recaptchaSiteKey}
              onChange={(e) => setRecaptchaSiteKey(e.target.value)}
              placeholder="reCAPTCHA Site Key"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-gold transition-colors"
            />
            <input
              type="password"
              value={recaptchaSecretKey}
              onChange={(e) => setRecaptchaSecretKey(e.target.value)}
              placeholder="reCAPTCHA Secret Key"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-gold transition-colors"
            />
          </div>

          {/* Email Verification toggle */}
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-brand-gold">
                <Mail className="w-5 h-5" />
                <h2 className="font-bold">Email Verification</h2>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge ok={emailConfigured} label={emailConfigured ? 'Email configured' : 'Not configured'} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-zinc-400">Require on registration</span>
                  <input
                    type="checkbox"
                    checked={requireEmailVerification}
                    onChange={(e) => setRequireEmailVerification(e.target.checked)}
                    disabled={!emailConfigured}
                    className="w-4 h-4 rounded border-zinc-800 text-brand-gold focus:ring-brand-gold bg-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </label>
              </div>
            </div>
            <p className="text-sm text-zinc-400">
              When enabled, new users must provide an email address and verify it with a 6-digit code.
              The admin account email is pre-verified and not affected.
            </p>
            {!emailConfigured && (
              <p className="text-xs text-amber-400">
                Configure an email provider below to enable this toggle.
              </p>
            )}
          </div>

          {/* Firebase */}
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-brand-gold">
                <Database className="w-5 h-5" />
                <h2 className="font-bold">Firebase Configuration (Optional)</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-zinc-400">Enable Firebase</span>
                <input
                  type="checkbox"
                  checked={isFirebaseEnabled}
                  onChange={(e) => setIsFirebaseEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 text-brand-gold focus:ring-brand-gold bg-zinc-950"
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              The app uses internal push notifications by default. Enable Firebase for FCM.
            </p>
            {isFirebaseEnabled && (
              <textarea
                value={firebaseConfig}
                onChange={(e) => setFirebaseConfig(e.target.value)}
                placeholder='{"apiKey": "...", "authDomain": "...", ...}'
                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-gold transition-colors font-mono text-sm"
              />
            )}
          </div>

          {/* OAuth */}
          <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-4">
            <h2 className="font-bold text-brand-gold">OAuth / SSO Providers</h2>
            <p className="text-sm text-zinc-400">Enable provider buttons on login/register. Credentials come from environment variables.</p>
            {[
              { label: 'Google OAuth', value: oauthGoogleEnabled, set: setOauthGoogleEnabled },
              { label: 'GitHub OAuth', value: oauthGithubEnabled, set: setOauthGithubEnabled },
              { label: 'OIDC SSO',     value: oauthOidcEnabled,   set: setOauthOidcEnabled   },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center justify-between gap-2 text-sm">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 text-brand-gold focus:ring-brand-gold bg-zinc-950"
                />
              </label>
            ))}
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-4 bg-brand-gold hover:bg-brand-gold/90 text-zinc-950 font-bold rounded-2xl transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Settings
            </button>
          </div>
        </form>

        {/* ── Email Provider configuration ──────────────────────────────────── */}
        <form onSubmit={handleSaveEmail} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-zinc-50">Email Provider</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Used for email verification and password recovery.
                </p>
              </div>
            </div>
            <StatusBadge ok={emailConfigured} label={emailConfigured ? 'Active' : 'Not configured'} />
          </div>

          {/* Provider selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEmailProvider(p.id)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  emailProvider === p.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-zinc-100">{p.label}</span>
                  {emailProvider === p.id && (
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </div>
                {p.badge && (
                  <span className="inline-block text-[10px] font-medium text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full mb-1">
                    {p.badge}
                  </span>
                )}
                <p className="text-[11px] text-zinc-500 leading-relaxed">{p.description}</p>
              </button>
            ))}
          </div>

          {/* Docs link */}
          {selectedProviderMeta?.docsUrl && (
            <p className="text-xs text-zinc-500">
              Need help?{' '}
              <a
                href={selectedProviderMeta.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {selectedProviderMeta.label} documentation →
              </a>
            </p>
          )}

          {/* Provider-specific fields */}
          {emailProvider !== 'none' && (
            <div className="space-y-4 pt-2 border-t border-zinc-800">

              {/* Common: From address + name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="From Email Address" hint="Must be verified in your provider dashboard.">
                  <TextInput
                    type="email"
                    value={emailFromAddress}
                    onChange={(e) => setEmailFromAddress(e.target.value)}
                    placeholder="noreply@yourdomain.com"
                    required
                  />
                </Field>
                <Field label="From Name (optional)" hint="Display name shown in email client.">
                  <TextInput
                    type="text"
                    value={emailFromName}
                    onChange={(e) => setEmailFromName(e.target.value)}
                    placeholder="Elahe Messenger"
                  />
                </Field>
              </div>

              {/* API-key-based providers */}
              {(emailProvider === 'brevo' ||
                emailProvider === 'resend' ||
                emailProvider === 'sendgrid' ||
                emailProvider === 'postmark') && (
                <Field
                  label={emailProvider === 'postmark' ? 'Server Token' : 'API Key'}
                  hint={
                    emailProvider === 'brevo'
                      ? 'Find it under SMTP & API → API Keys in your Brevo account.'
                      : emailProvider === 'resend'
                      ? 'Create an API key in the Resend dashboard (Settings → API Keys).'
                      : emailProvider === 'sendgrid'
                      ? 'Create a restricted key with Mail Send permission in SendGrid Settings.'
                      : 'Copy the Server Token from your Postmark server settings.'
                  }
                >
                  <TextInput
                    type="password"
                    value={emailApiKey}
                    onChange={(e) => setEmailApiKey(e.target.value)}
                    placeholder={emailApiKey === '••••••••' ? '(saved — enter new value to change)' : 'Paste your key here'}
                    onFocus={(e) => { if (e.target.value === '••••••••') setEmailApiKey(''); }}
                    required={emailApiKey !== '••••••••'}
                    autoComplete="off"
                  />
                </Field>
              )}

              {/* Mailgun-specific */}
              {emailProvider === 'mailgun' && (
                <>
                  <Field label="Mailgun API Key" hint="Find it in Mailgun → Settings → API Keys.">
                    <TextInput
                      type="password"
                      value={emailApiKey}
                      onChange={(e) => setEmailApiKey(e.target.value)}
                      placeholder={emailApiKey === '••••••••' ? '(saved — enter new value to change)' : 'key-xxxxxxxxxxxx'}
                      onFocus={(e) => { if (e.target.value === '••••••••') setEmailApiKey(''); }}
                      required={emailApiKey !== '••••••••'}
                      autoComplete="off"
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Sending Domain" hint="e.g. mg.yourdomain.com — must be verified in Mailgun.">
                      <TextInput
                        type="text"
                        value={emailMailgunDomain}
                        onChange={(e) => setEmailMailgunDomain(e.target.value)}
                        placeholder="mg.yourdomain.com"
                        required
                      />
                    </Field>
                    <Field label="Region" hint="US or EU hosting.">
                      <div className="relative">
                        <select
                          value={emailMailgunRegion}
                          onChange={(e) => setEmailMailgunRegion(e.target.value as 'us' | 'eu')}
                          className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-gold transition-colors pr-10"
                        >
                          <option value="us">US (api.mailgun.net)</option>
                          <option value="eu">EU (api.eu.mailgun.net)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      </div>
                    </Field>
                  </div>
                </>
              )}

              {/* Custom SMTP */}
              {emailProvider === 'smtp' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="SMTP Host" hint="e.g. smtp.gmail.com">
                      <TextInput
                        type="text"
                        value={emailSmtpHost}
                        onChange={(e) => setEmailSmtpHost(e.target.value)}
                        placeholder="smtp.example.com"
                        required
                      />
                    </Field>
                    <Field label="Port" hint="587 (STARTTLS) or 465 (TLS)">
                      <TextInput
                        type="number"
                        value={emailSmtpPort}
                        onChange={(e) => setEmailSmtpPort(Number(e.target.value))}
                        min={1}
                        max={65535}
                        required
                      />
                    </Field>
                    <Field label="Implicit TLS (port 465)" hint="Disable for STARTTLS.">
                      <div className="flex items-center h-10 gap-2">
                        <input
                          type="checkbox"
                          id="smtpSecure"
                          checked={emailSmtpSecure}
                          onChange={(e) => setEmailSmtpSecure(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 text-brand-gold bg-zinc-950"
                        />
                        <label htmlFor="smtpSecure" className="text-sm text-zinc-400 cursor-pointer">
                          Enable
                        </label>
                      </div>
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="SMTP Username">
                      <TextInput
                        type="text"
                        value={emailSmtpUser}
                        onChange={(e) => setEmailSmtpUser(e.target.value)}
                        placeholder="user@example.com"
                        autoComplete="username"
                        required
                      />
                    </Field>
                    <Field label="SMTP Password">
                      <TextInput
                        type="password"
                        value={emailSmtpPass}
                        onChange={(e) => setEmailSmtpPass(e.target.value)}
                        placeholder={emailSmtpPass === '••••••••' ? '(saved — enter new value to change)' : '••••••••'}
                        onFocus={(e) => { if (e.target.value === '••••••••') setEmailSmtpPass(''); }}
                        required={emailSmtpPass !== '••••••••'}
                        autoComplete="current-password"
                      />
                    </Field>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Email settings feedback */}
          {emailMessage.text && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${
              emailMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {emailMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <p className="text-sm font-medium">{emailMessage.text}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingEmail}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all disabled:opacity-50"
            >
              {isSavingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Email Provider
            </button>
          </div>

          {/* Test email */}
          {emailConfigured && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-300">Send Test Email</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-brand-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testEmailTo.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-semibold rounded-xl transition-all disabled:opacity-50 text-sm"
                >
                  {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Test
                </button>
              </div>
              {testEmailMessage.text && (
                <p className={`text-xs ${testEmailMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testEmailMessage.text}
                </p>
              )}
            </div>
          )}
        </form>

        {/* Security note */}
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
          <h3 className="text-sm font-bold text-zinc-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-500" />
            Security Note
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            API keys and SMTP passwords are encrypted at rest using AES-256-GCM before being stored in
            the database. Email verification codes expire after 10 minutes and are hashed with Argon2.
          </p>
        </div>
      </div>
    </div>
  );
}
