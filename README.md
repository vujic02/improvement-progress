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

It listens on **http://localhost:8080**. Defaults assume MySQL on
`localhost:3306` with `root` / `root`; override with environment variables:

| Variable | Default |
| --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/kaizen?createDatabaseIfNotExist=true&serverTimezone=UTC` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `root` |
| `SERVER_PORT` | `8080` |
| `JWT_SECRET` | a development value — **override it anywhere real**, minimum 32 bytes |
| `JWT_TTL_SECONDS` | `604800` (seven days) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174,http://localhost:5178` |

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
| `PATCH` | `/api/account` | `{ name, email }` | `{ id, name, email }` |
| `POST` | `/api/account/password` | `{ current, password, confirm }` | `204` |

Passwords are BCrypt hashes and never leave the server in any form. The token
carries the user id and nothing else.

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

The frontend still holds everything in `useState` — `TaskTypesProvider`,
`PursuitsProvider`, `ProfileProvider` and `SessionProvider` have not been
pointed at any of the above. The API is here and works; connecting the two is
the next job.
