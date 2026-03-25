# Phase 4 foundation applied

This patch lays down a production-ready Phase 4 baseline across four tracks.

## 4.1 Hardening
- Redis-backed rate limiting remains active and is now easier to scope by feature.
- Session tokens are hardened with issued-at metadata plus optional user-agent/IP binding.
- Secure upload/download now emit audit logs.
- Upload pipeline now performs MIME sniffing and lightweight malware signature screening before persistence.
- Global security headers and CSP are applied in middleware.

## 4.2 Architecture
- Added DTO parsing for socket sendMessage payloads.
- Added explicit socket event contracts.
- Added shared `lib/types.ts` to reduce implicit `any` usage.
- Added a dedicated audit helper and security-header helper to keep middleware/routes thin.

## 4.3 Messaging maturity
- Prisma message model now includes delivery status, delivered/read timestamps, retry count, last error, and idempotency key.
- Socket pipeline now supports idempotent sendMessage handling.
- Added delivery + read-status event support.
- Added retry metadata so a queue/worker can safely re-attempt failed sends later.

## 4.4 Real cryptographic maturity
- Added phase-4 protocol types for one-time prekey bundles and session bootstrap envelopes.
- This is intentionally server-safe scaffolding: it does not claim to implement a full Signal-style double ratchet yet.
- The patch establishes the contracts needed for future forward secrecy and key rotation work.

## Migration
Run Prisma migration/deploy after extracting the archive:

```bash
npx prisma migrate deploy
npx prisma generate
```
