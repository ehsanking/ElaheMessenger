# Production hardening checklist

Use `production.env.example` as the starting point for `.env.production`.

## Required before production deployment

- Set `APP_ENV=production`
- Set `NODE_ENV=production`
- Provide strong values for:
  - `JWT_SECRET`
  - `SESSION_SECRET`
  - `ENCRYPTION_KEY`
  - `POSTGRES_PASSWORD`
  - `MINIO_SECRET_KEY`
  - `ADMIN_PASSWORD`
- Do not use weak defaults such as `admin`, `pass`, `password`, or `supersecret`
- Ensure `package-lock.json` exists before production build

## Current enforcement in this branch

- `lib/env-security.ts` rejects weak or missing production secrets
- `lockfile-check.js` fails production build preparation when `package-lock.json` is missing

## Remaining integration work

- Call `validateProductionEnvironment()` from the production entrypoint before migrations and server start
- Replace permissive Docker/NPM production settings with strict SSL and lockfile-based installs
- Remove weak defaults from production compose paths
- Generate strong random credentials in the installer for PostgreSQL, MinIO, admin, JWT/session, and encryption keys
