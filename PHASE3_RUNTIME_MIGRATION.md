# Phase 3 runtime migration notes

This branch adds runtime building blocks for stronger 1:1 E2EE and secure encrypted attachments.

## What is already added

- real signed-prekey signing helpers
- conversation key derivation helpers
- encrypted attachment envelope helpers
- v2 registration bundle helpers
- live decrypt payload contract
- secure encrypted upload route
- secure encrypted download route
- explicit runtime E2EE policy for groups vs direct messages

## Important limitation

The current Prisma schema does not yet store a dedicated `signingPublicKey` or an explicit E2EE version field on `User`. Because of that, a complete runtime switch to the v2 registration bundle still requires a schema migration before the client can publish and retrieve the full verification bundle from the server.

## Required schema follow-up for full v2 runtime

Recommended additional user fields:

- `signingPublicKey String`
- `e2eeVersion String @default("legacy")`

Optional message fields for richer attachment metadata:

- `wrappedFileKey String?`
- `wrappedFileKeyNonce String?`
- `fileNonce String?`

## Product claim guidance

- 1:1 chat can move toward real E2EE with the phase 3 runtime path.
- Groups and channels must remain labeled as `not E2EE yet` until group key management is implemented.
- Legacy `/api/upload` should not be used for encrypted attachments.
