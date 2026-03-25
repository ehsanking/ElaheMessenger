# Phase D – Cryptographic maturity

This patch adds a production-oriented foundation for the next E2EE stage:

- **prekey bundles** via `UserDevice` + `OneTimePreKey` and `/api/e2ee/prekey-bundle/[userId]`
- **multi-device support** via `/api/e2ee/devices` and `/api/e2ee/devices/register`
- **forward secrecy foundation** via reserved/consumed one-time prekeys and per-session root/chain/message key references
- **ratchet layer foundation** via `ratchetPublicKey` and helper functions in `lib/e2ee-phase4.ts`
- **secure key lifecycle** via `E2EEKeyEvent` audit records and device/prekey rotation metadata

## Notes

- This patch intentionally adds a **server-side foundation** rather than claiming full Signal-grade Double Ratchet correctness.
- Sensitive key material remains client-owned; the server only stores public bundles, key references, and lifecycle metadata.
- Session bootstrap now consumes one-time prekeys when available and records a session lifecycle event.
- Existing legacy/v2 users still work; phase4 is additive and device-first.

## New routes

- `GET /api/e2ee/devices`
- `POST /api/e2ee/devices/register`
- `GET /api/e2ee/prekey-bundle/[userId]?deviceId=`
- `POST /api/e2ee/sessions/bootstrap`

## Migration

Apply:

- `npx prisma migrate deploy`
- `npx prisma generate`
