# Trusted lockfile workflow

A real `package-lock.json` must be generated from a trusted environment with working network access to the npm registry.

## Steps

1. Use a clean trusted machine or CI runner
2. Clone the repository
3. Run:
   - `./generate-lockfile.sh`
4. Review the generated `package-lock.json`
5. Commit both:
   - `package-lock.json`
   - any intentional `package.json` changes
6. Validate the production-safe build path:
   - `docker build -f Dockerfile.prod .`

## Why this matters

The production-safe Docker build uses `npm ci` and the repository now includes a lockfile guard. A fake or guessed lockfile would reduce trust and could break deterministic builds.
