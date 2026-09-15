# Kaizen

A personal day/month tracker. Two halves, two deployments:

| Folder | What it is | How it runs |
| --- | --- | --- |
| `frontend/` | React + TypeScript + Vite. Every screen, every style. | `npm run dev` |
| `backend/` | Spring Boot + MySQL. **JSON only** — it serves no HTML and no assets. | `mvn spring-boot:run` |

`PROJECT.md` holds the product rules both halves have to keep. If the code and
that file disagree, the code is the bug.

## Running the backend

Needs Java 21 and a MySQL server. Nothing else — the database itself is created
on first start (`createDatabaseIfNotExist=true`) and Flyway builds the schema.

```bash
cd backend
mvn spring-boot:run
```

`mvn spring-boot:run` starts with the `dev` profile (`application-dev.yml`),
the only place a development JWT secret exists. Anything else — `java -jar`, or
an IDE run without `SPRING_PROFILES_ACTIVE=dev` — must be given `JWT_SECRET` or
it refuses to start.

It listens on **http://localhost:8080**. Defaults assume MySQL on
`localhost:3306` with `root` / `root`; override with environment variables:

| Variable | Default |
| --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/kaizen?createDatabaseIfNotExist=true&serverTimezone=UTC` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `root` |
| `SERVER_PORT` | `8080` |
| `JWT_SECRET` | none — **required** outside the `dev` profile, minimum 32 bytes |
| `JWT_TTL_SECONDS` | `604800` (seven days) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174,http://localhost:5178` |

For a value that belongs to your machine only, such as your MySQL password,
create `backend/application-local.yml` instead of exporting a variable. Git
ignores it, and it is read when the API starts from `backend/`, as
`mvn spring-boot:run` does:

```yaml
spring:
  datasource:
    password: your-local-password
```

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

The two run on separate origins, which is the point of the split: every call
from the browser is cross-origin and has to be named in `CORS_ORIGINS`.

## The API

Everything is under `/api`, takes and returns JSON, and answers a failure with
`{ "error": "..." }` and a real status code. Every route except register and
login needs `Authorization: Bearer <token>`.

### Auth and account

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ name, email, password }` | `{ token, expiresIn, user }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ token, expiresIn, user }` |
| `GET` | `/api/auth/me` | — | `{ id, name, email }` |
| `PATCH` | `/api/account` | `{ name, email, password? }` — `password` required when the email changes | `{ id, name, email }` |
| `POST` | `/api/account/password` | `{ current, password, confirm }` | `{ token, expiresIn, user }` |
| `POST` | `/api/account/sign-out-everywhere` | — | `204` |

Passwords are BCrypt hashes of at most 72 bytes and never leave the server in
any form. The token carries the user id and the account's token version.
Changing the password or signing out everywhere bumps that version, which
retires every token issued before; the password change hands the caller a
fresh one.

Login allows 5 wrong passwords per client address and email in 15 minutes,
register 10 attempts per address in an hour; past that both answer `429`. The
counts live in memory, so they are per instance and reset on restart. Behind a
reverse proxy the client address is the proxy's unless forwarded headers are
trusted (`server.forward-headers-strategy`).

### Task types

Only the user's **custom** types are rows. The 12 defaults ship with the
frontend, cannot be renamed or removed, and are not served from here — but a
custom name still has to be unique against them, so
`TaskTypeDefaults.DEFAULT_LABELS` mirrors that list and has to stay in step.

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/task-types` | — |
| `POST` | `/api/task-types` | `{ label, icon }` |
| `DELETE` | `/api/task-types/{id}` | — |

The colour is assigned server-side, taking the next one from `CUSTOM_COLORS`
and wrapping around, because there is no colour picker yet.

### Pursuits — savings, self-improvement, dreams

One resource, three pages. `area` is `savings`, `growth` or `dreams`.

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/pursuits?area=savings` | — |
| `POST` | `/api/pursuits?area=savings` | `{ name, kind?, icon?, image?, target?, saved?, createdAt, targetAt }` |
| `DELETE` | `/api/pursuits/{id}` | — |
| `POST` | `/api/pursuits/{id}/steps` | `{ label }` |
| `PATCH` | `/api/pursuits/{id}/steps/{stepId}` | `{ done }`, or empty to flip it |
| `DELETE` | `/api/pursuits/{id}/steps/{stepId}` | — |
| `POST` | `/api/pursuits/{id}/contributions` | `{ amount }` — a delta, savings only |

Which fields an area accepts is enforced, not assumed: savings and growth
require a `kind` from their own closed list, dreams take an `icon` and no kind
at all, and only savings carries amounts. Dates are `yyyy-mm-dd`. An `image`
must be `https` — see the dreams section of `PROJECT.md` for why that check
lives on both sides.

### Profile and reminders

The server stores a reminder's **settings**; its title, body, icon, colour,
group and whether it is scheduled at all stay in the frontend's
`DEFAULT_REMINDERS`, joined on the key. A row exists for all eight from the
moment the account is created.

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/profile` | — |
| `PATCH` | `/api/profile` | `{ keepSignedIn?, paused?, push?, email? }` |
| `PATCH` | `/api/profile/reminders/{key}` | `{ enabled?, cadence?, weekday?, dayOfMonth?, time? }` |

## What is not wired yet

Sign-in is wired: `SessionProvider` and the account half of `ProfileProvider`
(details, password, sign out everywhere) talk to the API. `TaskTypesProvider`,
`PursuitsProvider` and the rest of `ProfileProvider` (reminders, channels) still
hold everything in `useState`, reset whenever a different account signs in.

Not built: password reset and email verification (both need outgoing email),
and Apple/Google sign-in, whose buttons were removed until OAuth exists.
