'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Globe,
  Lock,
  UserPlus,
  Smartphone,
  EyeOff,
  Code,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import EncryptionAnimationClient from '@/components/EncryptionAnimationClient';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import LanguageSelector from '@/components/LanguageSelector';

const logoSrc = '/logo.png';

const features = [
  {
    icon: Lock,
    title: 'Direct-message E2EE',
    description:
      '1:1 chats use client-side encryption. Group and channel E2EE continues to roll out and is clearly marked in-product.',
  },
  {
    icon: EyeOff,
    title: 'Honest metadata model',
    description:
      'The server keeps only the minimal operational metadata needed for delivery, abuse handling, and audits — transparently documented.',
  },
  {
    icon: UserPlus,
    title: 'No phone required',
    description:
      'Register with just a username. No SIM, no phone number — keep your identity fully under your control.',
  },
  {
    icon: Globe,
    title: 'Self-hosted first',
    description:
      'Run your own Elahe Messenger server. You own the hardware, the data, and the encryption keys.',
  },
  {
    icon: Smartphone,
    title: 'PWA & offline-ready',
    description:
      'Install Elahe Messenger on any device. It works offline and feels like a native application.',
  },
  {
    icon: Code,
    title: 'Open source',
    description:
      'Transparent and auditable. Our code is open for anyone to inspect, fork, and verify its security.',
  },
];

const stats = [
  { label: 'Encryption', value: 'Curve25519 + AES-GCM' },
  { label: 'Built with', value: 'Next.js 15 · React 19' },
  { label: 'Licence', value: 'MIT · Open Source' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Aurora background layer */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-aurora opacity-60 dark:opacity-45" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-mesh opacity-60 dark:opacity-25"
      />

      {/* ===== Navigation ===== */}
      <header className="sticky top-0 z-30 w-full">
        <div className="mx-auto mt-4 flex w-full max-w-7xl items-center justify-between rounded-2xl px-4 sm:px-6">
          <nav className="glass flex w-full items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Elahe Messenger home">
              <div className="relative h-9 w-9">
                <Image
                  src={logoSrc}
                  alt="Elahe Messenger"
                  fill
                  sizes="36px"
                  className="object-contain drop-shadow-[0_0_12px_oklch(78%_0.14_82_/_0.4)]"
                  unoptimized
                  priority
                />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                Elahe<span className="text-gradient-brand">&nbsp;Messenger</span>
              </span>
            </Link>

            <div className="hidden items-center gap-7 text-sm font-medium text-[var(--text-secondary)] md:flex">
              <a href="#features" className="transition-colors hover:text-[var(--text-primary)]">
                Features
              </a>
              <Link href="/security" className="transition-colors hover:text-[var(--text-primary)]">
                Security
              </Link>
              <Link href="/open-source" className="transition-colors hover:text-[var(--text-primary)]">
                Open source
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggleButton />
              <Link
                href="/auth/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="btn-modern inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[color:var(--accent-soft)] hover:bg-[var(--accent-hover)]"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pt-20 sm:px-6 sm:pt-28">
        {/* Decorative animation */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[85vh]">
          <EncryptionAnimationClient />
        </div>

        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)]/60 px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm backdrop-blur-md"
          style={{ animation: 'var(--animate-fade-in)' }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand-gold)]" />
          <span>v4 · Redesigned for 2026 · Geist + OKLCH</span>
        </div>

        <h1
          className="max-w-4xl text-balance text-center text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl"
          style={{ animation: 'var(--animate-fade-in-up)' }}
        >
          Private messaging that{' '}
          <span className="text-gradient-brand">respects your keys</span>.
        </h1>

        <p
          className="mt-6 max-w-2xl text-balance text-center text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl"
          style={{ animation: 'var(--animate-fade-in-up)', animationDelay: '80ms' }}
        >
          Elahe Messenger is a self-hostable, open-source messenger built for operators
          and teams who need clear trust boundaries, zero surveillance, and honest
          security status.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animation: 'var(--animate-fade-in-up)', animationDelay: '160ms' }}
        >
          <Link
            href="/auth/register"
            className="btn-modern group inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-7 py-4 text-base font-semibold text-white shadow-[0_14px_40px_-12px_oklch(58%_0.22_270_/_0.5)] hover:bg-[var(--accent-hover)]"
          >
            <span>Create free account</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/auth/login"
            className="btn-modern inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 px-7 py-4 text-base font-semibold text-[var(--text-primary)] backdrop-blur hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)]"
          >
            Sign in
          </Link>
        </div>

        {/* Logo “spotlight” block */}
        <div
          className="relative mx-auto mt-20 flex w-full max-w-4xl items-center justify-center"
          style={{ animation: 'var(--animate-scale-in)', animationDelay: '220ms' }}
        >
          <div className="glass-strong relative w-full overflow-hidden rounded-3xl p-6 sm:p-10">
            <div aria-hidden className="absolute inset-0 bg-mesh opacity-40" />
            <div className="relative flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 -z-10 animate-[glow-pulse_3s_ease-in-out_infinite] rounded-full" />
                <Image
                  src={logoSrc}
                  alt="Elahe Messenger"
                  width={112}
                  height={112}
                  className="object-contain drop-shadow-[0_0_30px_oklch(78%_0.14_82_/_0.55)]"
                  priority
                  unoptimized
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-[var(--text-muted)]">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-primary)]/60 px-3.5 py-1.5 backdrop-blur"
                  >
                    <span className="text-[var(--text-muted)]">{stat.label}</span>
                    <span className="text-[var(--text-primary)]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Feature grid ===== */}
      <section id="features" className="relative mx-auto mt-28 w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)]/70 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--success)]" />
            Built for trust
          </span>
          <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything you need for{' '}
            <span className="text-gradient-accent">sovereign conversations</span>
          </h2>
          <p className="max-w-2xl text-[var(--text-secondary)]">
            A modern stack: Next.js 15, React 19, Tailwind v4, and a WebCrypto-native
            encryption pipeline — all open, all yours.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <FeatureCard key={feature.title} index={idx} {...feature} />
          ))}
        </div>
      </section>

      {/* ===== CTA banner ===== */}
      <section className="relative mx-auto mt-28 w-full max-w-7xl px-4 sm:px-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-80"
            style={{
              background:
                'radial-gradient(60% 120% at 50% 0%, oklch(72% 0.18 275 / 0.35), transparent 70%)',
            }}
          />
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-primary)]/70 px-3 py-1 text-xs font-medium text-[var(--text-secondary)] backdrop-blur">
              <Zap className="h-3.5 w-3.5 text-[var(--color-brand-gold)]" />
              Ready in minutes
            </div>
            <h3 className="text-balance text-3xl font-semibold sm:text-4xl">
              Spin up your own encrypted messenger today.
            </h3>
            <p className="text-[var(--text-secondary)]">
              One-command install, Docker-ready, and production-hardened. Migrate your
              team without giving up control.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/auth/register"
                className="btn-modern inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/security"
                className="btn-modern inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] backdrop-blur hover:border-[var(--border-hover)]"
              >
                Read security status
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="relative mx-auto mt-20 w-full max-w-7xl px-4 pb-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-sm text-[var(--text-muted)] md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Elahe Messenger. Built with care for your
            privacy.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/security" className="hover:text-[var(--text-primary)]">
              Security
            </Link>
            <Link href="/open-source" className="hover:text-[var(--text-primary)]">
              Open source
            </Link>
            <a
              href="#features"
              className="hover:text-[var(--text-primary)]"
            >
              Features
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  index: number;
};

function FeatureCard({ icon: Icon, title, description, index }: FeatureCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-hover)] hover:shadow-[0_24px_60px_-20px_oklch(58%_0.22_270_/_0.35)]"
      style={{ animation: 'var(--animate-fade-in-up)', animationDelay: `${120 + index * 60}ms` }}
    >
      {/* Gradient wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, oklch(72% 0.18 275 / 0.12), transparent 60%)',
        }}
      />
      <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--color-brand-gold)] shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="relative mb-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="relative text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
