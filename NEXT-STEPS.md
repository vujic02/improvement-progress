# Connecting the backend to the frontend

A beginner's walkthrough for this repo. Read top to bottom, do it in order.
Every step is small enough to run and see working before the next one.

**Where things stand:** the backend is already built (steps 1–6 below are done —
read them anyway, they explain what the code you inherited is doing). The
frontend still keeps everything in `useState` and talks to nothing. The real
work starts at **step 7**.

---

## The mental model first

A browser and a server are two separate programs. They share nothing — no
variables, no memory. The only thing that crosses between them is **text over
HTTP**: the browser sends a request, the server sends JSON back.

```
React component            fetch()              Spring controller
  useState  ────────►  HTTP + JSON  ────────►  Service ──► Repository ──► MySQL
     ▲                                                                     │
     └──────────────  JSON response  ◄─────────────────────────────────────┘
```

"Connecting the backend" means one thing: **replace the `useState` that invents
data with a `fetch` that asks the server for it.** Everything below is detail.

---

## 1. Models — the shape of your data

A model (a JPA _entity_) is one Java class per database table. One instance =
one row.

- **users** — `id`, `name`, `email`, `passwordHash`, `createdAt`
- **pursuits** — savings, growth and dreams in one table, split by `area`
- **pursuit_steps** — the checkboxes inside a pursuit
- **custom_task_types** — only the user's own; the 12 defaults ship in the frontend
- **profile_settings** — one row per user
- **reminders** — settings only, joined to frontend metadata on `reminder_key`

In this repo: `backend/src/main/java/com/kaizen/*/`, e.g. `user/User.java`,
`pursuit/Pursuit.java`. The tables themselves are created by Flyway from
`backend/src/main/resources/db/migration/V1__init.sql`.

Rule to internalise: **the SQL file owns the schema, the entity mirrors it.**
If they disagree, the app fails to start or silently loses columns. Change the
table by writing a _new_ `V2__whatever.sql` — never edit `V1`, it has already
run on your machine and Flyway will refuse.

## 2. Repositories — talking to the database

An interface per model, extending `JpaRepository<Entity, Long>`. You write no
SQL; Spring writes it from the method name.

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
}
```

`findAll`, `findById`, `save`, `deleteById` come free. In this repo:
`UserRepository`, `PursuitRepository`, `CustomTaskTypeRepository`,
`ProfileSettingsRepository`, `ReminderRepository`.

## 3. DTOs — what actually goes on the wire

Never send an entity to the browser. A `User` carries `passwordHash`; that must
never leave the server. A DTO is a small record holding exactly the fields the
client is allowed to see or send.

- `RegisterRequest` / `LoginRequest` — what comes in
- `UserResponse`, `PursuitResponse`, `StepResponse` — what goes out

In this repo: `*/dto/`. Validate them with annotations (`@NotBlank`, `@Email`,
`@Size`) so bad input is rejected before your code ever runs.

## 4. Services — the rules

Business logic lives here, not in the controller. "Is this name already taken",
"can dreams have an amount" (no), "is this image an `https` URL", "cap custom
task types at 10". Services take DTOs in, return DTOs out, and are the only
thing that touches repositories. See `PursuitService`, `AuthService`.

## 5. Controllers — the URLs

Thin. Map a URL to a service call and return the result.

```java
@RestController
@RequestMapping("/api/task-types")
public class TaskTypeController {
    @GetMapping List<TaskTypeResponse> list(...) { ... }
    @PostMapping TaskTypeResponse add(@Valid @RequestBody NewTaskTypeRequest body) { ... }
    @DeleteMapping("/{id}") void remove(@PathVariable Long id) { ... }
}
```

Errors: throw `ApiException`, and `ApiExceptionHandler` turns it into
`{ "error": "..." }` plus a real status code. The frontend depends on that
shape — keep it.

## 6. Security and CORS — the two things that will bite you

**JWT.** Login returns a signed token. Every later request must carry
`Authorization: Bearer <token>`. `JwtAuthFilter` reads it, verifies it, and puts
the user id where controllers can get it. No token, no data — that is why a
request that works in `curl` with a token 401s from a browser without one.

**CORS.** The frontend runs on `http://localhost:5178`, the backend on
`http://localhost:8080`. Different port = different origin, and browsers block
cross-origin calls unless the server explicitly allows them. This repo allows
5173/5174/5178 via `CORS_ORIGINS` in `application.yml`.

> A "CORS error" in the console is almost never a CORS bug. It is usually a 500
> or a crash on the backend — the failed response just lacks the CORS header, so
> the browser reports the missing header instead of the real error. **Always
> check the backend terminal before you touch CORS config.**

---

## 7. Prove the backend works — before touching React

Do not debug two programs at once. Get the API answering in a terminal first.

```bash
# terminal 1 — needs Java 21 and a running MySQL
cd backend
mvn spring-boot:run
```

```bash
# terminal 2
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Nikola","email":"me@example.com","password":"password123"}'
```

You get back `{ "token": "...", "expiresIn": ..., "user": {...} }`. Copy the
token and use it:

```bash
TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaXNzIjoia2FpemVuIiwiaWF0IjoxNzg4OTU4MDQ3LCJleHAiOjE3ODk1NjI4NDd9.4Or_5idW4iTSv2TA_OAxtVwwD5ZSDpLarwiTWZJlwQ4
curl http://localhost:8080/api/task-types -H "Authorization: Bearer $TOKEN"
```

`[]` is a success. When both of those work, the backend is not the problem for
the rest of this document.

## 8. One API client on the frontend

Do not scatter `fetch` across components. Write it once.

**`frontend/.env.local`** (Vite only exposes vars prefixed `VITE_`):

```
VITE_API_URL=http://localhost:8080
```

**`frontend/src/lib/api.ts`:**

```ts
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

let token: string | null = localStorage.getItem("kaizen.token");

export function setToken(next: string | null) {
  token = next;
  if (next) localStorage.setItem("kaizen.token", next);
  else localStorage.removeItem("kaizen.token");
}

export function getToken() {
  return token;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });
export const del = (path: string) => api<void>(path, { method: "DELETE" });
```

That is the whole networking layer. Nothing else in the app calls `fetch`.

## 9. Auth first — nothing else works without a token

Every route except register and login needs a token, so `SessionProvider`
(`frontend/src/session/SessionProvider.tsx`) is the first thing to rewrite. It
currently fakes it: `signIn(name)` just flips a boolean.

What it needs to do:

1. `register(name, email, password)` → `POST /api/auth/register` → `setToken(res.token)`
2. `signIn(email, password)` → `POST /api/auth/login` → `setToken(res.token)`
3. On mount, if a token is in `localStorage`, call `GET /api/auth/me` to check it
   is still valid — restores the session on refresh, and clears the token on 401
4. `signOut()` → `setToken(null)` and reset state
5. Expose `loading` while step 3 is in flight, so the app does not flash the
   welcome screen at an already-signed-in user

```ts
const signIn = useCallback(async (email: string, password: string) => {
  try {
    const res = await post<AuthResponse>("/api/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    return { ok: true } as const;
  } catch (e) {
    return { ok: false, reason: (e as Error).message } as const;
  }
}, []);
```

Test it: sign in, refresh the page, still signed in. Sign out, refresh, signed
out. Get that solid before step 10.

## 10. One provider at a time

Order: **task types → pursuits → profile**. Simplest first.

For each provider the change is always the same three things:

1. **Load on mount** — a `useEffect` that GETs the list and `setState`s it, with
   `loading` and `error` state alongside the data
2. **Every mutation becomes async** — `add`/`remove` call the API, then update
   local state from the response
3. **Keep the validation** — the checks in the provider today (blank names,
   duplicates, the 10-type cap, `https` images, target-before-start dates) stay.
   They give an instant message with no round trip. The server checks the same
   things because a browser can be bypassed. **Both sides validate. That is
   correct, not duplicated work.**

`TaskTypesProvider` becomes roughly:

```ts
const [custom, setCustom] = useState<TaskType[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  get<TaskType[]>("/api/task-types")
    .then(setCustom)
    .catch(() => setCustom([]))
    .finally(() => setLoading(false));
}, []);

const addCustom = useCallback(
  async (label: string, icon: IconName): Promise<Result> => {
    // ...the existing local checks, unchanged...
    try {
      const created = await post<TaskType>("/api/task-types", { label: name, icon });
      setCustom((prev) => [...prev, created]);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
  [custom],
);
```

**The one thing that breaks callers:** `add` returned `Result`, now it returns
`Promise<Result>`. Every call site must `await` it, and the pages that do
`const res = add(...); if (!res.ok) ...` will silently always take the `ok`
branch until you do. Fix them as you go — TypeScript flags most of them.

Then repeat for:

- `PursuitsProvider` — `GET /api/pursuits?area=savings|growth|dreams`, plus
  steps and contributions. One provider instance per area, so pass the area in
  and build the URL from it.
- `ProfileProvider` — `GET /api/profile`, `PATCH /api/profile`,
  `PATCH /api/profile/reminders/{key}`. Remember the server stores reminder
  _settings_ only; join them onto the frontend's `DEFAULT_REMINDERS` by key.

## 11. Loading and errors are now real states

With `useState` data appeared instantly. With a server, three things can happen:
loading, loaded, failed. Every page needs to handle all three, or it renders an
empty grid that looks identical to "you have nothing yet".

Cheapest honest version: a skeleton or spinner while `loading`, and a retry
message on error. Do not leave a failed request looking like empty data.

For mutations, pick one and be consistent:

- **Wait for the server, then update** — simple, correct, slightly slow. Start here.
- **Optimistic** — update immediately, roll back on failure. Nicer, more code.
  Do it later, and only for toggles like a checkbox step.

## 12. Optional: kill CORS with a dev proxy

Instead of calling `http://localhost:8080` directly, let Vite forward `/api`:

```ts
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } },
  },
});
```

Then set `VITE_API_URL` to an empty string and the browser only ever talks to
one origin, so CORS never applies in development. Production still needs the
real `CORS_ORIGINS` setting.

## 13. Order of work — the checklist

- [ ] Backend runs, `register` + `login` answer `curl` (step 7)
- [ ] `lib/api.ts` and `.env.local` exist (step 8)
- [ ] `SessionProvider` does real register/login/me/logout; refresh keeps you in (step 9)
- [ ] `TaskTypesProvider` loads and writes through the API (step 10)
- [ ] `PursuitsProvider` — savings first, then growth, then dreams (step 10)
- [ ] `ProfileProvider` and reminders (step 10)
- [ ] Every page handles loading and error, not just data (step 11)
- [ ] Delete the mock seed data in `frontend/src/data/` that is now server-owned
- [ ] `npm run build` and `mvn test` both pass

## 14. Debugging, in the order that finds it fastest

1. **Backend terminal.** A stack trace there explains most frontend errors,
   including ones that look like CORS.
2. **Network tab.** Look at the actual request: is the `Authorization` header
   there, is the URL right, what is the status code, what is the response body?
3. **Status codes tell you where the bug is.**
   - `401` — no token, expired token, or wrong secret. Frontend/auth problem.
   - `403` — token is fine, the route is blocked. Check `SecurityConfig`.
   - `400` — your JSON does not match the DTO. Field names are case-sensitive.
   - `404` — wrong URL. Check the `@RequestMapping` prefix.
   - `500` — backend bug. Read the stack trace, stop guessing on the frontend.
4. **`curl` the same call.** Works in `curl`, fails in the browser → frontend
   problem. Fails in both → backend problem.
