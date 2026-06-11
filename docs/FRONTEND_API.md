# Frontend API Reference

How the React app talks to the backend. Two layers:

1. **`src/services/api.jsx`** — the axios client and the raw request functions.
2. **`src/hooks/useTasks.js`** — React Query hooks that wrap those functions with caching,
   loading/error state, and cache invalidation.

Components should use the hooks; call the raw functions directly only for one-off needs.

---

## The axios client (`services/api.jsx`)

```js
import api from "../services/api";
```

Configured once:

- `baseURL` = `import.meta.env.VITE_API_BASE_URL` or `""` (empty = same-origin; the dev server
  and nginx both proxy `/api` to the backend, keeping auth cookies first-party).
- `withCredentials: true` — sends/receives the httpOnly auth cookies.
- `xsrfCookieName: "XSRF-TOKEN"`, `xsrfHeaderName: "X-XSRF-TOKEN"` — axios auto-attaches the CSRF
  header on state-changing requests.
- `timeout` = `VITE_API_TIMEOUT` or `30000` ms.

**Silent refresh:** a response interceptor catches `401`s, calls `/api/v1/auth/refresh` once
(single-flight, so concurrent 401s trigger only one refresh), and retries the original request.
If the refresh fails it dispatches a `window` event `auth:session-expired`, which `AuthContext`
listens for to clear the session and route to login.

### Request functions

| Function | Method + path | Returns (`.data`) |
|----------|---------------|-------------------|
| `login(username, password)` | POST `/api/v1/auth/login` | `{ username, role }` |
| `register(username, password)` | POST `/api/v1/auth/signup` | `{ message }` |
| `refreshSession()` | POST `/api/v1/auth/refresh` | `{ username, role }` |
| `logout()` | POST `/api/v1/auth/logout` | — |
| `getTasks(params)` | GET `/api/v1/tasks` | `PaginatedResponse` |
| `getTaskStatistics()` | GET `/api/v1/tasks/statistics` | `{ total, todo, inProgress, done }` |
| `getTaskById(id)` | GET `/api/v1/tasks/{id}` | `TaskResponseDTO` |
| `createTask(task)` | POST `/api/v1/tasks` | created `TaskResponseDTO` |
| `updateTask(id, task)` | PUT `/api/v1/tasks/{id}` | updated `TaskResponseDTO` |
| `deleteTask(id)` | DELETE `/api/v1/tasks/{id}` | — |

Each returns the raw axios promise (resolve to `response`, read `response.data`). `getTasks`
accepts `{ page, size, sortBy, sortDirection, status, priority, keyword }`. `keyword`, `title`, and
`description` are HTML-escaped client-side as defence-in-depth before sending.

```js
const { data } = await getTasks({ status: "TODO", keyword: "report" });
console.log(data.content, data.totalElements);
```

---

## Auth context (`context/AuthContext.jsx`)

```js
const { user, isAuthenticated, isBootstrapping, login, register, logout } = useAuth();
```

| Field | Type | Description |
|-------|------|-------------|
| `user` | `{ username, role } \| null` | current user (non-sensitive; tokens stay in cookies) |
| `isAuthenticated` | bool | `!!user` |
| `isBootstrapping` | bool | `true` while the initial session-restore check runs |
| `login(username, password)` | async | logs in, stores `user`, returns `{ username, role }` |
| `register(username, password)` | async | registers a user |
| `logout()` | async | revokes server-side + clears local state |

On load it restores the session via `refreshSession()` (only if a stored user marker exists, to
avoid a guaranteed 401 for anonymous visitors). `PrivateRoute` shows a spinner while
`isBootstrapping`, then redirects to `/login` if not authenticated.

---

## React Query hooks (`hooks/useTasks.js`)

Wrap the request functions with caching + state. Query keys: `["tasks", filters]` and
`["statistics"]`.

### `useTasks(filters)`
```js
const { data, isLoading, isError, isFetching, refetch } = useTasks({ status, priority, keyword });
const tasks = data?.content ?? [];
```
Keeps previous data while refetching (`placeholderData`), so changing filters doesn't flash a
spinner.

### `useStatistics()`
```js
const { data: stats } = useStatistics(); // { total, todo, inProgress, done }
```

### Mutations
```js
const create = useCreateTask();
const update = useUpdateTask();
const remove = useDeleteTask();

await create.mutateAsync(task);                 // create
await update.mutateAsync({ id, task });          // update
await remove.mutateAsync(id);                     // delete
```
Each mutation invalidates the `tasks` and `statistics` queries on success, so the list and stats
refetch automatically. `mutation.isPending` exposes in-flight state.

Defaults (set in `main.jsx`): `retry: 2`, `refetchOnWindowFocus: false`, `staleTime: 30s`.

---

## Other hooks

### `useDebounce(value, delay = 400)` (`hooks/useDebounce.js`)
Returns a debounced copy of `value`. Used so the task search fires a request after typing pauses,
not on every keystroke.
```js
const debounced = useDebounce(searchTerm); // 400ms
```

---

## Config

Set in `frontend/.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `""` (same-origin) | only set if the API is on a different origin |
| `VITE_API_TIMEOUT` | `30000` | axios timeout in ms |
