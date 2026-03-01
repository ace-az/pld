# Requirements: PLD Management App

**Defined:** 2026-03-01
**Core Value:** Mentors can reliably run session workflows and students can safely access only their own session experience.

## v1 Requirements

### Authorization

- [ ] **AUTHZ-01**: Admin endpoints require JWT authentication and explicit admin role validation.
- [ ] **AUTHZ-02**: Session mutation endpoints enforce mentor/student ownership rules server-side.
- [ ] **AUTHZ-03**: Question and student CRUD operations are scoped to the owning mentor.
- [ ] **AUTHZ-04**: Chat history and chat save endpoints require authentication and session membership checks.

### Security & Identity

- [x] **SECU-01**: Server startup fails when `JWT_SECRET` is missing or default-like.
- [ ] **SECU-02**: Login/register/verify/reset endpoints are protected by rate limiting.
- [ ] **SECU-03**: Verification and reset codes use one shared persistence mechanism that survives process restarts.

### Data Integrity & Performance

- [ ] **DATA-01**: Supabase schema and model field usage are aligned and documented through migration-ready updates.
- [ ] **DATA-02**: Session and student retrieval queries avoid full-table in-memory filtering for user-scoped reads.

### Quality & Regression Safety

- [ ] **TEST-01**: Automated API tests cover auth, authorization boundaries, and core session access rules.
- [ ] **TEST-02**: Regression tests cover verification/reset lifecycle behavior across restart-safe storage.

## v2 Requirements

### Platform Improvements

- **PLAT-01**: Normalize JSON-heavy session/chat structures into relational tables for larger-scale workloads.
- **PLAT-02**: Add AI provider fallback and backend mediation for client AI runtime dependency.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile-native app clients | Stabilizing current web product has higher priority. |
| New product modules unrelated to mentor/student session flow | This milestone focuses on hardening and reliability. |
| Full architecture rewrite | In-place improvement minimizes delivery risk. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTHZ-01 | Phase 1 | Pending |
| AUTHZ-02 | Phase 1 | Pending |
| AUTHZ-03 | Phase 2 | Pending |
| AUTHZ-04 | Phase 1 | Pending |
| SECU-01 | Phase 1 | Complete |
| SECU-02 | Phase 2 | Pending |
| SECU-03 | Phase 2 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap initialization*
