# Phase A – Production hardening

This patch applies the requested production-hardening workstream in a way that fits the current codebase.

## What changed

### 1) Legacy paths retired
- `app/chat-v2/page.tsx` now redirects to `/chat`.
- `middleware.ts` now issues a permanent redirect for `/chat-v2` and marks the route as retired.
- The already-disabled legacy public upload endpoint remains blocked with `410 Gone`.

### 2) Authorization unified
- Centralized secure attachment authorization now goes through `lib/secure-attachments.ts`.
- Socket direct-message authorization now also uses `authorizeConversationAccess(...)`.
- Group messaging remains enforced through `canSendToGroup(...)`.

### 3) Secure attachment pipeline
- New `lib/secure-attachments.ts` consolidates:
  - conversation access validation
  - malware screening hook
  - private storage
  - expiring signed download token creation/verification
  - upload/download audit logging
- `app/api/upload-secure/route.ts` and `app/api/upload-secure/[fileId]/route.ts` now share this pipeline.

### 4) Audit + observability
- New `lib/observability.ts` tracks process counters/gauges.
- Health endpoint now reports:
  - DB status
  - Redis status
  - background queue status
  - observability snapshot
- Middleware now emits `x-request-id` for correlation.
- Socket rejections, secure uploads, secure downloads, and rate-limit decisions contribute metrics.

### 5) Distributed rate limiting
- Rate-limit keys are now namespaced (`rl:`).
- Redis remains the primary shared-state backend when configured.
- Allowed/blocked outcomes now emit metrics for visibility.

### 6) Background jobs
- `lib/task-queue.ts` now supports named background jobs.
- When Redis is configured, jobs are pushed to a shared Redis list and processed by a worker started in `server.ts`.
- When Redis is not configured, jobs still run via the in-process queue.
- Push notifications from socket send flow now use background jobs instead of inline execution.

## Operational notes
- For multi-instance deployments, set `REDIS_URL`.
- The health endpoint is now more sensitive to Redis availability and will report `degraded` if Redis is expected but unavailable.
- Background jobs use a simple Redis list worker model to keep the patch dependency-light and compatible with the current project.
