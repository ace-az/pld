# Roadmap: PLD Management App

**Created:** 2026-03-01
**Depth:** Standard
**Milestone Focus:** Brownfield hardening for secure multi-user production use

## Phases

- [ ] **Phase 1: Access Control Guardrails** - Lock down highest-risk server-side authorization gaps and startup auth baseline.
- [ ] **Phase 2: Identity Flow Hardening** - Stabilize verification/reset identity flows and add abuse resistance.
- [ ] **Phase 3: Data Alignment and Query Efficiency** - Align runtime data model with schema and remove inefficient scoped-read patterns.
- [ ] **Phase 4: Regression Safety Net** - Add automated regression coverage for auth and session-risk paths.

## Phase Details

### Phase 1: Access Control Guardrails
**Goal:** Sensitive API operations are protected by server-side authorization, and insecure JWT configuration cannot reach runtime.
**Depends on:** Nothing (first phase)
**Requirements:** AUTHZ-01, AUTHZ-02, AUTHZ-04, SECU-01
**Success Criteria** (what must be TRUE):
1. Unauthenticated calls to admin, chat history/save, and protected session mutation routes are rejected.
2. Authenticated non-admin users receive forbidden responses on admin user-management endpoints.
3. Mentor/student users cannot mutate session resources outside their ownership or membership scope.
4. Server startup fails fast when `JWT_SECRET` is missing or default-like.
**Plans:** 1/3 complete

### Phase 2: Identity Flow Hardening
**Goal:** Identity verification and password recovery flows are durable across restarts and resilient to endpoint abuse, with mentor-scoped CRUD boundaries enforced.
**Depends on:** Phase 1
**Requirements:** AUTHZ-03, SECU-02, SECU-03
**Success Criteria** (what must be TRUE):
1. Question-set and student CRUD only succeed for the owning mentor.
2. Login/register/verify/reset endpoints throttle repeated abusive requests while normal usage continues to work.
3. Verification and reset codes persist across process restarts until expiration.
4. Users can complete verify and reset lifecycles consistently using one shared code-persistence mechanism.
**Plans:** TBD

### Phase 3: Data Alignment and Query Efficiency
**Goal:** Data model usage and Supabase schema are aligned, and user-scoped reads avoid full-table in-memory filtering.
**Depends on:** Phase 1
**Requirements:** DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
1. A fresh environment using documented schema/migration artifacts supports existing auth, session, and student flows without schema mismatch failures.
2. Session and student retrieval returns only caller-scoped records in multi-user datasets.
3. User-scoped session/student read paths run via scoped database queries rather than full-table fetch-and-filter behavior.
**Plans:** TBD

### Phase 4: Regression Safety Net
**Goal:** Automated regression tests continuously verify high-risk auth and session-access behavior.
**Depends on:** Phase 1, Phase 2, Phase 3
**Requirements:** TEST-01, TEST-02
**Success Criteria** (what must be TRUE):
1. A single documented command runs automated API regression tests in local and CI contexts.
2. Regression tests fail when admin/auth/session authorization boundaries are violated.
3. Regression tests fail when verification/reset lifecycle behavior breaks, including restart-safe persistence expectations.
**Plans:** TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Access Control Guardrails | 1/3 | In Progress | - |
| 2. Identity Flow Hardening | 0/TBD | Not started | - |
| 3. Data Alignment and Query Efficiency | 0/TBD | Not started | - |
| 4. Regression Safety Net | 0/TBD | Not started | - |

## Requirement Coverage Map

| Requirement | Phase |
|-------------|-------|
| AUTHZ-01 | Phase 1 |
| AUTHZ-02 | Phase 1 |
| AUTHZ-03 | Phase 2 |
| AUTHZ-04 | Phase 1 |
| SECU-01 | Phase 1 |
| SECU-02 | Phase 2 |
| SECU-03 | Phase 2 |
| DATA-01 | Phase 3 |
| DATA-02 | Phase 3 |
| TEST-01 | Phase 4 |
| TEST-02 | Phase 4 |

**Coverage:** 11/11 v1 requirements mapped exactly once.
