# Security hardening patch summary

This patch applies the requested high-priority remediations for the messaging project:

- socket runtime unified to `lib/socket.ts`
- group send authorization enforced before persistence/broadcast
- session issuance now binds to request context (user-agent and optional IP)
- logout now requires same-origin and CSRF validation
- secure upload/download now validate both group and direct-conversation access
- legacy public upload endpoint disabled
- antivirus layer extended with heuristic blocking and optional ClamAV integration
- CSP tightened in production by removing `unsafe-inline` and `unsafe-eval` from `script-src`
- E2EE v2 registration now persists `signingPublicKey`
- admin/setup secret logging no longer prints credential values to stdout
- server actions now verify session cookies with request context
- audit coverage expanded for blocked socket sends, persist failures, and legacy upload access
