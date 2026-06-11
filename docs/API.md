# Backend API Reference

REST API for the Task Manager backend (Spring Boot). All application endpoints are versioned
under `/api/v1`.

Interactive docs (Swagger UI) are served by the running app at **`/swagger-ui.html`**, and the
raw OpenAPI spec at **`/v3/api-docs`**.

- Base URL (dev): `http://localhost:8080`
- Content type: `application/json`

## Authentication model

Auth is **cookie-based** — there is no token in the response body.

- `POST /api/v1/auth/login` sets two `httpOnly` cookies: a short-lived `access_token` (JWT) and
  a longer-lived, rotating `refresh_token`. They are sent automatically by the browser; JavaScript
  cannot read them.
- A readable `XSRF-TOKEN` cookie is also set. For any **state-changing** request
  (`POST`/`PUT`/`DELETE`) you must echo it back in the `X-XSRF-TOKEN` header (CSRF protection).
  Browsers/axios do this automatically; manual clients must copy the cookie value into the header.
- When the access token expires, call `POST /api/v1/auth/refresh` to rotate it.
- The `/api/v1/auth/**` endpoints are exempt from CSRF.

Non-browser clients may instead send the access token as `Authorization: Bearer <token>`.

## Error format

Errors return a consistent body:

```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-06-10 15:30:00",
  "errors": { "title": "Title must be between 3 and 100 characters" }
}
```

`errors` is only present for field-validation failures.

| Status | When |
|--------|------|
| 400 | Validation failed / bad query param type |
| 401 | Not authenticated, bad credentials (login), or expired session (refresh) |
| 403 | Authenticated but not allowed, or missing/invalid CSRF token |
| 404 | Task/user not found |
| 409 | Username already exists (signup) |
| 429 | Too many auth attempts (rate limit: 5 per 15 min per IP) |
| 500 | Unexpected server error (no internal details leaked) |

---

## Auth endpoints

### POST `/api/v1/auth/signup`
Register a new user.

Request:
```json
{ "username": "john_doe", "password": "Password123!", "role": "USER" }
```
- `username` — 3–20 chars, letters/numbers/underscore only.
- `password` — 8–128 chars, must include uppercase, lowercase, digit, special char.
- `role` — optional, defaults to `USER`.

Response `201`:
```json
{ "message": "User registered successfully!" }
```
Errors: `400` (validation), `409` (username taken).

### POST `/api/v1/auth/login`
Authenticate and receive auth cookies.

Request:
```json
{ "username": "john_doe", "password": "Password123!" }
```
Response `200` (+ `Set-Cookie: access_token`, `refresh_token`, `XSRF-TOKEN`):
```json
{ "username": "john_doe", "role": "ROLE_USER" }
```
Errors: `400` (validation), `401` (`Invalid username or password` — same message whether the user
is unknown or the password is wrong, to avoid enumeration), `429` (rate limited).

### POST `/api/v1/auth/refresh`
Rotate the refresh token and issue a new access token. Reads the `refresh_token` cookie.

Response `200` (+ new cookies):
```json
{ "username": "john_doe", "role": "ROLE_USER" }
```
Errors: `401` (missing/expired/revoked refresh token).

### POST `/api/v1/auth/logout`
Revoke the refresh token and clear the auth cookies. Reads the `refresh_token` cookie.

Response `204` (no body).

---

## Task endpoints

All require authentication (auth cookie or Bearer token). Tasks are scoped to the current user.
`POST`/`PUT`/`DELETE` additionally require the `X-XSRF-TOKEN` header.

### GET `/api/v1/tasks`
List the current user's tasks (paginated, filterable).

Query params (all optional):

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | int | `0` | zero-based |
| `size` | int | `10` | 1–100 |
| `sortBy` | string | `createdAt` | one of `createdAt`, `updatedAt`, `dueDate`, `priority`, `status`, `title` |
| `sortDirection` | string | `desc` | `asc` or `desc` |
| `status` | enum | — | `TODO`, `IN_PROGRESS`, `DONE` |
| `priority` | enum | — | `LOW`, `MEDIUM`, `HIGH` |
| `keyword` | string | — | matches title/description (case-insensitive) |

Response `200`:
```json
{
  "content": [
    {
      "id": 1,
      "title": "Finish report",
      "description": "Q3 summary",
      "status": "TODO",
      "priority": "HIGH",
      "dueDate": "2026-07-01",
      "createdAt": "2026-06-10T15:30:00",
      "updatedAt": "2026-06-10T15:30:00"
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 1,
  "totalPages": 1,
  "hasNext": false,
  "hasPrevious": false
}
```

### GET `/api/v1/tasks/statistics`
Counts for the current user's tasks.

Response `200`:
```json
{ "total": 5, "todo": 2, "inProgress": 2, "done": 1 }
```

### GET `/api/v1/tasks/{id}`
A single task (must belong to the current user). Response `200` is a `TaskResponseDTO` (see above).
Errors: `404`.

### POST `/api/v1/tasks`
Create a task. Requires `X-XSRF-TOKEN`.

Request (`TaskRequestDTO`):
```json
{
  "title": "Finish report",
  "description": "Q3 summary",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-07-01"
}
```
- `title` — required, 3–100 chars.
- `description` — optional, ≤ 500 chars.
- `status` — defaults to `TODO`.
- `priority` — defaults to `MEDIUM`.
- `dueDate` — optional ISO date (`yyyy-MM-dd`), must be today or in the future.

Response `201`: the created `TaskResponseDTO`.

### PUT `/api/v1/tasks/{id}`
Update a task (same body as create). Requires `X-XSRF-TOKEN`. Response `200`. Errors: `404`.

### DELETE `/api/v1/tasks/{id}`
Delete a task. Requires `X-XSRF-TOKEN`. Response `204`. Errors: `404`.

---

## Operational endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/healthcheck` | public | `{ "status": "UP", "application": "TaskManager", "timestamp": "..." }` |
| `GET /actuator/health` | public | health with `liveness`/`readiness` probe groups |
| `GET /actuator/info` | public | build/app info |
| `GET /actuator/prometheus` | authenticated | Prometheus metrics |

---

## curl example (full flow)

```bash
BASE=http://localhost:8080/api/v1
JAR=cookies.txt

# signup + login (login stores cookies, including XSRF-TOKEN)
curl -s -X POST $BASE/auth/signup -H 'Content-Type: application/json' \
  -d '{"username":"john_doe","password":"Password123!","role":"USER"}'
curl -s -c $JAR -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"john_doe","password":"Password123!"}'

# read the CSRF token from the cookie jar
XSRF=$(grep XSRF-TOKEN $JAR | awk '{print $7}')

# create a task (needs cookies + CSRF header)
curl -s -b $JAR -X POST $BASE/tasks -H 'Content-Type: application/json' \
  -H "X-XSRF-TOKEN: $XSRF" \
  -d '{"title":"Finish report","priority":"HIGH","status":"TODO"}'

# list tasks
curl -s -b $JAR "$BASE/tasks?status=TODO"
```
