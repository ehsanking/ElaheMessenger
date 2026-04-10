'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Lock } from 'lucide-react';

/**
 * Modern, lightweight hero animation:
 *  - Soft orbiting rings with pulsating core
 *  - Secure packet traveling along a sine path
 *  - Respects prefers-reduced-motion
 */
export default function EncryptionAnimation() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60 dark:opacity-40"
    >
      <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        {/* Background orbit grid */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <linearGradient id="orbit-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(72% 0.18 275 / 0)" />
              <stop offset="50%" stopColor="oklch(72% 0.18 275 / 0.6)" />
              <stop offset="100%" stopColor="oklch(72% 0.18 275 / 0)" />
            </linearGradient>
            <linearGradient id="gold-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(78% 0.14 82 / 0)" />
              <stop offset="50%" stopColor="oklch(78% 0.14 82 / 0.85)" />
              <stop offset="100%" stopColor="oklch(78% 0.14 82 / 0)" />
            </linearGradient>
            <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(82% 0.14 82 / 0.55)" />
              <stop offset="100%" stopColor="oklch(82% 0.14 82 / 0)" />
            </radialGradient>
          </defs>

          {/* Concentric orbits */}
          {[90, 160, 230, 310].map((r, idx) => (
            <motion.circle
              key={r}
              cx="500"
              cy="300"
              r={r}
              stroke="url(#orbit-stroke)"
              strokeWidth={idx === 1 ? 1.2 : 0.8}
              strokeDasharray={idx % 2 === 0 ? '2 10' : '1 14'}
              initial={{ rotate: 0, opacity: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.5 }
                  : {
                      rotate: idx % 2 === 0 ? 360 : -360,
                      opacity: 0.6,
                    }
              }
              transition={{
                duration: 28 + idx * 6,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformOrigin: '500px 300px' }}
            />
          ))}

          {/* Encrypted packet travelling on a curved path */}
          <motion.path
            d="M 100 320 Q 500 40 900 320"
            stroke="url(#gold-stroke)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="4 16"
            initial={{ pathLength: 0 }}
            animate={
              prefersReducedMotion
                ? { pathLength: 1 }
                : { pathLength: [0, 1, 1], opacity: [0.2, 0.9, 0.2] }
            }
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Central glow */}
          <circle cx="500" cy="300" r="180" fill="url(#core-glow)" />
        </svg>

        {/* Pulsing lock core */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { scale: 1, opacity: 0.7 }
              : { scale: [0.95, 1.05, 0.95], opacity: [0.6, 0.95, 0.6] }
          }
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[color:var(--color-brand-gold)]/40 bg-[var(--bg-elevated)]/70 shadow-[0_0_60px_0_oklch(78%_0.14_82_/_0.35)] backdrop-blur-xl"
        >
          <Lock className="h-8 w-8 text-[color:var(--color-brand-gold)]" />
        </motion.div>
      </div>
    </div>
  );
}
