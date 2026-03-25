# Phase B/C – Messaging maturity and scale foundations

Implemented in this patch:

## Phase B – Messaging maturity
- Delivery/read state foundation extended with offline sync and delivery ACK APIs.
- Retry queue support with delayed retries and dead-letter queue for background jobs.
- Message reactions with toggle semantics and socket propagation.
- Reply metadata foundation via `replyToId` and expanded history payloads.
- Message edit flow with edit window and socket event propagation.
- Conversation drafts with per-user/per-conversation persistence.
- Metadata-only search on encrypted conversations (message id + file name); plaintext server-side search is intentionally not added because the project is E2EE-oriented.

## Phase C – Scale architecture
- Redis Socket.IO adapter retained and documented as the horizontal scaling path.
- Background jobs upgraded with retry, delayed queue, and dead-letter tracking.
- Object storage abstraction introduced; local object bucket is the default driver.
- Metrics/observability dashboard added at `/admin/observability`.
- Cache strategy helpers added for conversation caches and invalidation.
- Sharding strategy helper added for future hash-by-conversation routing.

## Notes
- The object storage driver is filesystem-backed in this patch to avoid adding heavyweight cloud SDKs without deployment credentials. The abstraction is in `lib/object-storage.ts` and can be swapped for S3-compatible storage later.
- Server-side search is deliberately `metadata_only` in E2EE mode. Searching plaintext ciphertext on the server would conflict with the security posture.
