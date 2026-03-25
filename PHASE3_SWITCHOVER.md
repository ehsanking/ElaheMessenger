# Phase 3 switchover guide

This repository includes drop-in Phase 3 runtime files that can replace the legacy runtime entry points.

## Drop-in files

- `server.phase3.ts` -> `server.ts`
- `app/auth/register-v2/page.tsx` -> `app/auth/register/page.tsx`
- `app/chat-v2/page.tsx` -> `app/chat/page.tsx`
- `prisma/schema.phase3.prisma` -> `prisma/schema.prisma`

## Fast path

Run:

```sh
./adopt-phase3-runtime.sh
```

This copies the Phase 3 files onto the primary paths and keeps `.phase3-backup` copies of the previous files.

## After the copy

1. Review the resulting diff
2. Apply the Prisma migration or run the phase 3 schema patch
3. Regenerate Prisma client
4. Restart the app with the phase 3 runtime path
5. Validate:
   - v2 registration
   - direct-message live decrypt metadata
   - secure attachment upload/download
   - group claim remains `not E2EE yet`

## Notes

The GitHub connector used for this migration work was able to add the drop-in files reliably, but direct overwrite of certain existing large files was inconsistent. This switchover script makes the final replacement deterministic for maintainers.
