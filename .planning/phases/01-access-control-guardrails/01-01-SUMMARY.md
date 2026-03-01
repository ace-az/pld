---
phase: 01-access-control-guardrails
plan: 01
subsystem: auth
tags: [jwt, express, authorization, middleware]
requires: []
provides:
  - "Fail-fast JWT secret validation during startup"
  - "Shared JWT secret accessor for sign/verify paths"
  - "Reusable role/session authorization middleware contracts"
affects: [01-02, 01-03, auth-routes, session-routes]
tech-stack:
  added: []
  patterns: [fail-fast-config-validation, centralized-jwt-secret-accessor, composable-authz-middleware]
key-files:
  created:
    - server/utils/envValidation.js
    - server/utils/jwtSecret.js
    - server/utils/authzMiddleware.js
    - server/tests/access-control-guardrails.task1.test.js
    - server/tests/access-control-guardrails.task2.test.js
  modified:
    - server/index.js
    - server/utils/authMiddleware.js
    - server/controllers/authController.js
key-decisions:
  - "JWT runtime must fail closed: startup now throws when JWT_SECRET is missing or default-like."
  - "JWT sign/verify paths must read the same validated secret via getJwtSecret()."
  - "Session access checks use canonical user discordId from userModel.findUserById and attach req.authz for reuse."
patterns-established:
  - "Pattern 1: Validate critical env security inputs before server boot."
  - "Pattern 2: Keep authz policy in reusable middleware, not controller duplication."
requirements-completed: [SECU-01]
duration: 5 min
completed: 2026-03-01
---

# Phase 1 Plan 1: Access Control Primitives Summary

**JWT startup guardrails now fail closed, and shared role/session authorization middleware contracts are ready for downstream route hardening.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T12:11:13Z
- **Completed:** 2026-03-01T12:16:51Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added `assertJwtSecretOrThrow()` and `getJwtSecret()` to remove insecure JWT secret fallback behavior.
- Wired startup validation before middleware/route registration and centralized all auth JWT signing/verifying secret access.
- Added `requireRole`, `resolveSessionAccess`, `requireSessionMemberOrMentor`, and `requireSessionMentorOwner` middleware contracts with reusable `req.authz` context.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Enforce fail-fast JWT secret validation and remove insecure fallbacks** - `ef83529` (test)
2. **Task 1 (GREEN): Enforce fail-fast JWT secret validation and remove insecure fallbacks** - `99fdf4d` (feat)
3. **Task 2 (RED): Create shared authorization middleware contracts** - `398af70` (test)
4. **Task 2 (GREEN): Create shared authorization middleware contracts** - `295a1d5` (feat)

## Files Created/Modified
- `server/utils/envValidation.js` - Validates JWT secret presence/strength and throws on unsafe values.
- `server/utils/jwtSecret.js` - Central accessor ensuring all JWT operations use validated secret.
- `server/index.js` - Fails startup immediately when JWT secret is invalid.
- `server/utils/authMiddleware.js` - Uses centralized secret accessor for JWT verification.
- `server/controllers/authController.js` - Uses centralized secret accessor for JWT signing.
- `server/utils/authzMiddleware.js` - Provides role/session access middleware and shared `req.authz` context.
- `server/tests/access-control-guardrails.task1.test.js` - TDD coverage for JWT secret guard and shared accessor wiring.
- `server/tests/access-control-guardrails.task2.test.js` - TDD coverage for role/session authorization middleware contracts.

## Decisions Made
- Enforced strict fail-fast startup behavior for JWT secret safety instead of allowing runtime fallback.
- Kept token payload/expiry behavior unchanged while routing secret lookup through `getJwtSecret()`.
- Standardized session access context on `req.authz` to avoid duplicate policy lookups in downstream routes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Node `--test` process spawn blocked in sandbox**
- **Found during:** Task 1 RED verification
- **Issue:** `node --test ...` failed with `spawn EPERM` in this execution sandbox.
- **Fix:** Switched to direct test execution (`node server/tests/...`) using the same `node:test` test files.
- **Files modified:** None
- **Verification:** Both Task 1 and Task 2 test files executed and passed via direct Node invocation.
- **Committed in:** N/A (execution method adjustment only)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope change; only test invocation method changed to satisfy the same TDD checks.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Plan `01-01` outputs are in place for route-level hardening plans (`01-02`, `01-03`) to consume.

---
*Phase: 01-access-control-guardrails*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: `.planning/phases/01-access-control-guardrails/01-01-SUMMARY.md`
- FOUND commits: `ef83529`, `99fdf4d`, `398af70`, `295a1d5`
