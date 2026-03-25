# Phase 3 schema patch recommendation

To fully wire the phase 3 E2EE runtime path into the main application flow, the current Prisma schema should be extended.

## Recommended additions to `User`

- `signingPublicKey String`
- `e2eeVersion String @default("legacy")`

## Recommended additions to `Message`

These are optional but recommended if encrypted attachments should be reconstructable without overloading ad-hoc payload fields:

- `wrappedFileKey String?`
- `wrappedFileKeyNonce String?`
- `fileNonce String?`

## Why this patch is needed

The current schema stores:

- `identityKeyPublic`
- `signedPreKey`
- `signedPreKeySig`

But it does not store the sender signing public key required to verify a v2 signed prekey at runtime. It also does not store an explicit E2EE version marker.

Without this patch:

- runtime helpers can validate and normalize v2 bundles,
- but the server cannot persist the full verification bundle in a first-class way,
- and live decrypt metadata remains partially legacy-compatible only.
