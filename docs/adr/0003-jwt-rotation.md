# ADR-0003: Two-phase JWT secret rotation with overlap window

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Platform team

## Context

The platform signs HS256 JWTs with a single shared secret
(`JWT_SECRET`) that every service uses to validate incoming bearer
tokens. The companion `JWT_REFRESH_SECRET` is treated identically.

A shared secret has one operational hazard: rotating it requires every
service to be redeployed at the same instant, otherwise in-flight
tokens become invalid and every user is logged out. There is no
grace window today — a single rolling deploy will 401 half of all
requests.

We want the ability to rotate `JWT_SECRET` (and the refresh secret)
without coordinating a cluster-wide restart, and without invalidating
active access tokens.

## Decision

We adopt a **two-phase, overlap-window rotation** strategy.

### Key layout

Services accept a comma-separated list of secrets via env:

```
JWT_SECRET=v2-current-secret,v1-previous-secret
JWT_REFRESH_SECRET=v2-current-secret,v1-previous-secret
```

The **first entry** is the **signing** key. Subsequent entries are
**validation-only** keys kept until their access tokens are expected
to have expired.

### Verification algorithm

When verifying a JWT:

1. Decode the header to identify the `kid` (key id) — we add a `kid`
   claim on issuance (`kid = "v1"` for the new key).
2. If `kid` matches the current signing key, verify normally.
3. Otherwise, walk the list of accepted secrets from oldest to
   newest; the first that validates wins. This bounds the work and
   ensures the **current** key always tries first.
4. On miss: 401.

### Rotation procedure

1. Generate `v2`. Append to `JWT_SECRET` so the value becomes
   `v2-secret,v1-secret`. The current signing key is still `v1` (entry
   position 1) **until** we cut over.
2. Deploy all services. They now accept tokens signed with either key.
3. Switch the signing key: move `v2` to position 1, drop `v1` to
   position 2. Deploy. New tokens are signed with `v2`.
4. After `accessTokenTtl` (15 minutes) plus a safety margin, drop
   `v1` entirely. Deploy.

Refresh tokens follow the same cadence with their 7-day TTL.

### Operational guardrails

- `JWT_SECRET` and `JWT_REFRESH_SECRET` must rotate together (same
  set of services, same deploys). A mismatch between access and
  refresh secrets is a hard fail.
- The keys list is bounded at 2 entries in production. Long grace
  windows accumulate stale secrets; if more is needed, re-sign active
  sessions instead.
- The auth service emits the `kid` header on every new token from
  day one of this rollout. We will not deploy this rotation before
  every service can read `kid`.

## Consequences

**Positive**

- Rotation is a normal rolling deploy — no cluster-wide restart, no
  forced logout.
- Token revocation is straightforward: drop a key from the list and
  redeploy. Tokens signed with that key become untrusted on the next
  pod.
- We can stage a rotation behind a feature flag in case we need to
  roll back.

**Negative / costs**

- Verification does up to N (today: 2) HMAC computations per request.
  For HS256 this is negligible; if we move to RS256 the cost grows.
- Migrations are visible in env diffs and may confuse reviewers — we
  document the procedure in `docs/RUNBOOK.md#secrets-rotation`.
- A bug that silently ignores the `kid` claim and only checks the
  first key would break rotation. We add a unit test that mints a
  token with the previous key and asserts verification still
  succeeds.

**Follow-ups**

- Implement `verifyWithKeyList(token)` in
  `services/auth/src/utils/jwt.ts` and reuse from the gateway.
- Add a health check that returns the current `kid` so dashboards can
  confirm rotation state.
- After this lands, ADR-0008 (refresh-token rotation) becomes a
  trivial extension of the same machinery.