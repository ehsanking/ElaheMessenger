# Legacy to production-safe migration

This repository now includes a production-safe deployment path alongside the legacy deployment files.

## Use these files for hardened production deployments

- `Dockerfile.prod`
- `entrypoint.prod.sh`
- `compose_prod_full.yml`
- `production.env.example`
- `prod_env_generator.sh`
- `deploy-production-safe.sh`

## Recommended migration path

1. Generate a strong `.env.production`
   - Start from `production.env.example`
   - Or use `prod_env_generator.sh`
2. Add a real `package-lock.json`
3. Build and deploy with:
   - `./deploy-production-safe.sh`

## Why this replaces the legacy path

The legacy files still contain permissive defaults and compatibility behavior for easier bootstrap. The production-safe path removes weak defaults, requires explicit secrets, validates environment variables before startup, and uses `npm ci` with a required lockfile.

## Remaining final step

A real `package-lock.json` still needs to be generated and committed from a trusted environment with network access.
