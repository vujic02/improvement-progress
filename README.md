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

## CI and deployment

One workflow, `.github/workflows/build-and-deploy.yml`, with three jobs:

| Job | Runs | What it does |
| --- | --- | --- |
| `backend` | always | `mvn -B -ntp clean verify`, then uploads the jar |
| `frontend` | always | `npm run lint` and `npm run build`, then uploads `dist/` |
| `deploy` | `master` only | takes those two artifacts to the VPS and restarts the API |

A pull request stops after the two build jobs. A push to `master` carries on
into `deploy`, which **needs both of them to pass** — a failing build never
reaches the server. It takes what those jobs uploaded rather than building the
same commit a second time, so what was tested is exactly what ships.

### What the deploy does

1. Downloads the jar and `dist/` from the two build jobs. The VPS needs no
   Java, Node or checkout of this repo.
2. `rsync --delete`s the site into the web root, so a stale asset from an
   older build cannot survive.
3. Copies the jar next to the running one, keeps the old one as `.prev`, swaps
   it in and restarts the service.
4. Waits up to 60 seconds for the API to answer. There is no actuator here, so
   the check is an unauthenticated `GET /api/auth/me` returning `401` — proof
   it is up without needing an account. **Flyway migrates at startup, so a bad
   migration fails here.**
5. If it never answers, puts the previous jar back and restarts. The deploy
   fails loudly; the site keeps running the version it had.

Rolling back a bad release that *does* start: revert the commit on `master`
and let the deploy run again.

### Secrets it needs

Repository settings → Secrets and variables → Actions:

| Secret | What it is |
| --- | --- |
| `VPS_HOST` | the server's hostname or IP |
| `VPS_USER` | the deploy user to log in as |
| `VPS_SSH_KEY` | that user's **private** key, the whole file including the BEGIN and END lines |
| `VPS_HOST_KEY` | the server's public host key — `ssh-keyscan your-host` from a machine you trust |
| `VPS_PORT` | only if SSH is not on 22 |

`VPS_HOST_KEY` is what stops the runner from trusting whatever answers at that
address. Do not replace it with an `ssh-keyscan` inside the workflow: that
accepts a new key every run, which is the thing the check is for.

### Preparing the VPS once

The paths are the `env:` block at the top of `deploy.yml` — change them there
if yours differ. Given a deploy user called `deploy`:

```bash
# Let the deploy user own what it writes, so the copy steps need no sudo.
sudo chown -R deploy:deploy /opt/kaizen /var/www/kaizen

# The one privileged thing it does. Nothing else is allowed.
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart kaizen-api' \
  | sudo tee /etc/sudoers.d/kaizen-deploy
sudo chmod 440 /etc/sudoers.d/kaizen-deploy
```

Add the deploy user's public key to `~deploy/.ssh/authorized_keys`, and check
`which systemctl` matches the path in the sudoers line.

The frontend build reads `frontend/.env.production`, where `VITE_API_URL` is
empty: the browser calls `/api` on its own origin, so **nginx must proxy
`/api` to the API port**. If you ever serve the API from its own subdomain
instead, set `VITE_API_URL` to that address and add it to `CORS_ORIGINS`.

## What is not wired yet

Sign-in and task types are wired: `SessionProvider`, `TaskTypesProvider` and
the account half of `ProfileProvider` (details, password, sign out everywhere)
talk to the API. `PursuitsProvider` and the rest of `ProfileProvider`
(reminders, channels) still hold everything in `useState`, reset whenever a
different account signs in.

Not built: password reset and email verification (both need outgoing email),
and Apple/Google sign-in, whose buttons were removed until OAuth exists.
