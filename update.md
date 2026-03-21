You are a senior full-stack developer specializing in authentication and security.

I need you to implement a COMPLETE and ROBUST token-based authentication system
for my application that handles token expiration gracefully — without showing
"wrong token" errors to the user when they return after being idle.

## REQUIREMENTS:

### 1. DUAL TOKEN STRATEGY (Access + Refresh Tokens)
- SHORT-LIVED Access Token (15–30 minutes expiry)
- LONG-LIVED Refresh Token (7–30 days expiry)
- Store Access Token in memory (JavaScript variable, NOT localStorage)
- Store Refresh Token in an HTTP-only, Secure, SameSite cookie
- NEVER store sensitive tokens in localStorage or sessionStorage

### 2. SILENT TOKEN REFRESH MECHANISM
- Before EVERY API call, check if the access token is expired or about to
  expire (within 60 seconds of expiry)
- If expired, AUTOMATICALLY call the /refresh-token endpoint using the
  refresh token to get a NEW access token — silently, without user interaction
- Queue all pending API requests while the token is being refreshed
- Retry the failed/queued requests with the new access token
- This must be implemented using an Axios/Fetch INTERCEPTOR (request +
  response interceptors)

### 3. RESPONSE INTERCEPTOR — HANDLE 401 ERRORS GRACEFULLY
- If any API call returns 401 (Unauthorized):
   a. Attempt ONE silent token refresh
   b. If refresh succeeds → retry the original request with the new token
   c. If refresh fails → THEN and ONLY THEN redirect to login page
- Prevent multiple simultaneous refresh requests (use a "isRefreshing" flag
  and a queue)

### 4. TOKEN EXPIRATION DECODING
- Decode the JWT on the client side to read the `exp` field
- Create a utility function: `isTokenExpired(token): boolean`
- Create a utility function: `getTokenRemainingTime(token): number`
- Use these to proactively refresh BEFORE expiration

### 5. BACKEND — TOKEN ENDPOINTS
- POST /api/auth/login → returns { accessToken, refreshToken }
- POST /api/auth/refresh-token → accepts refresh token, validates it,
  returns NEW accessToken (and optionally rotates the refresh token)
- POST /api/auth/logout → invalidates refresh token in database
- Store refresh tokens in the DATABASE with: userId, token, expiresAt,
  isRevoked
- On refresh: validate the token exists in DB, is not revoked, and
  is not expired

### 6. DATABASE CONNECTION HANDLING
- Use CONNECTION POOLING (not single connections)
- Implement automatic reconnection logic
- Add health-check endpoint: GET /api/health
- Handle database connection drops without crashing the app
- Use try-catch around all DB operations with meaningful error responses
- Return proper HTTP status codes:
   - 401 for expired/invalid tokens
   - 403 for revoked tokens
   - 503 for database unavailability

### 7. FRONTEND AUTH STATE MANAGEMENT
- Create an AuthContext/AuthProvider (React) or auth store (Vue/other)
- Track: isAuthenticated, isLoading, user, accessToken
- On app load/mount:
   a. Attempt silent refresh (call /refresh-token)
   b. If successful → user stays logged in
   c. If failed → redirect to login
- Show a LOADING SPINNER during this initial auth check
  (never flash login page then redirect)

### 8. AUTO-LOGOUT & ACTIVITY TRACKING
- Track user activity (mouse move, keypress, clicks)
- If user is TRULY inactive for X minutes, warn them before logging out
- Show a "Session expiring" modal with option to extend
- On tab focus/visibility change → immediately check token validity

### 9. SECURITY BEST PRACTICES
- Implement refresh token ROTATION (issue new refresh token on each refresh,
  invalidate the old one)
- Implement refresh token FAMILY detection (if a revoked token is reused,
  revoke ALL tokens for that user — potential theft detected)
- Set proper CORS configuration
- Rate-limit the /refresh-token endpoint
- Use HTTPS only
- Set secure cookie flags: HttpOnly, Secure, SameSite=Strict

### 10. ERROR HANDLING UX
- NEVER show "wrong token" or "jwt expired" raw errors to users
- Map all auth errors to user-friendly messages
- If token refresh fails silently → redirect to login with message:
  "Your session has expired. Please log in again."
- Preserve the intended URL so after re-login they return where they were

## TECH STACK:
[REPLACE with your stack, e.g.:]
- Frontend: React + vite
- Backend: Node.js
- Database: PostgreSQL(Supabase)
- ORM: Prisma

## DELIVERABLES:
1. Backend auth middleware
2. Backend token service (generate, verify, refresh, revoke)
3. Backend auth routes (login, refresh, logout)
4. Database schema/model for refresh tokens
5. Frontend API client with interceptors (Axios preferred)
6. Frontend AuthContext/Provider with all state management
7. Frontend ProtectedRoute component
8. Frontend useAuth hook
9. Token utility functions

Please provide COMPLETE, PRODUCTION-READY code with comments explaining
each section. No shortcuts. No placeholder logic.