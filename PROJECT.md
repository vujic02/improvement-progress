# Kaizen — project notes

Working notes for decisions that aren't obvious from the code. Rules here are
the source of truth; if the code and this file disagree, the code is the bug.

## Two halves

`frontend/` is the React app; `backend/` is a Spring Boot + MySQL **API and
nothing else** — it serves no HTML and no assets, and the two run on separate
origins. `README.md` has the routes and how to start each half.

Where a rule below is about validation, it now holds in two places. The client
check is what makes the form pleasant; the server check is the guarantee. Both
have to move together — a rule loosened on one side only is a bug on the other.

## Naming

Two names, and they are **not** interchangeable. Both live in `frontend/src/lib/brand.ts`
and nothing should hardcode either one again.

| Constant | Value | Used for |
| --- | --- | --- |
| `APP_NAME` | Kaizen | The product — wordmarks, breadcrumb roots, tab title, footer |
| `ASSISTANT_NAME` | Jarvis | The voice that greets you on the welcome screen |
| `APP_TAGLINE` | Better by the day | Not used in the UI yet |

Kaizen is Japanese for continuous improvement, which is the whole premise.
Jarvis stays as the assistant persona — renaming one must never rename the
other. The three remaining literal "Jarvis" strings in `frontend/src/` are code comments
describing the assistant, which is correct.

## What this is

A personal day/month tracker. Screens live behind a hash router:

| Route | Screen |
| --- | --- |
| `#/` | Jarvis welcome — typed + spoken greeting, then hands off to sign-in |
| `#/signin`, `#/register` | Auth, sharing `AuthLayout` |
| `#/boot` | Second greeting after auth, hands off to the dashboard |
| `#/dashboard` | Month habit grid or week day-cards |
| `#/savings` | Savings, investments, debt and bills |
| `#/self-improvement` | Learning, training, nutrition, reading and five more |
| `#/dreams` | Big goals and dreams |
| `#/task-types` | Manage task types |
| `#/profile` | Account details and notification settings |

Signed-in pages sit inside `DashboardLayout` (sidebar, navbar, backdrop, footer).

## Task types

Task types are the categories a day gets scored against. They drive the habit
grid rows and the analysis breakdown on the dashboard.

**Rules:**

- **12 defaults**, shipped with the app, in `DEFAULT_TASK_TYPES`
  (`frontend/src/data/taskTypes.ts`). They cannot be renamed or removed.
- **Up to 10 custom types** per user, on top of the defaults
  (`CUSTOM_TASK_TYPE_LIMIT`). So 22 rows maximum in the habit grid.

  The default count is 12 for layout reasons as much as content ones: the card
  grid divides evenly at 2, 3, 4 and 6 columns, so no breakpoint leaves a
  ragged last row. Changing it means re-checking that.
- A custom type is **an icon plus a name**. Nothing else, for now.
- **Names are capped at 30 characters** (`TASK_TYPE_NAME_MAX`), enforced by
  `maxLength` on the input, re-checked in `addCustom`, and again by
  `TaskTypeService` on the server.
- Names must be non-blank and unique, case-insensitively, across defaults and
  custom types together.
- Custom types are removable; removing one frees its slot immediately.

**Colour:** there is no colour picker yet. Each new custom type takes the next
colour from `CUSTOM_COLORS` and wraps around when the list runs out. The
server picks it (`TaskTypeService.add`) and the provider keeps what comes back;
the create form's preview repeats the same pick, so the two must stay in step.
If a picker is added later, keep this as the default rather than making the
user choose before they can save.

**Loading:** custom types come from `GET /api/task-types` when the provider
mounts. Until that answers, and if it fails, the page shows a loading or retry
card rather than the empty state, and "New task type" stays disabled — the
duplicate and limit checks in `addCustom` have nothing to check against yet.

**Icons:** the create form offers `PICKABLE_ICONS`, a subset of the app's icon
set. Adding an icon to the picker means adding a glyph to
`frontend/src/components/Icon.tsx` first — the set is hand-drawn, not a library.

## Day tasks — what the dashboard scores

A day task is **a label, a task type and a day**, plus whether it is done. It
is the unit the whole tracker counts: today's list is the tasks for today, and
the habit grid and week view are the same rows read over a longer range.

- **One store, both shapes.** There is no separate "ticked this type today"
  record. A habit-grid cell is filled when a task of that type is done on that
  day, so the list and the grid can never disagree. (The grid still reads mock
  data — see the gaps below.)
- **The type is one string to the client, two columns in the database.**
  `typeId` is either a built-in's id (`deep`) or a custom type's id (`7`). The
  server keeps them in `default_key` and `custom_type_id`, exactly one set, so
  the custom half can be a real foreign key.
- **Deleting a custom task type deletes the tasks logged against it**, and past
  scores change with them. `ON DELETE CASCADE` says so in the schema, and
  `TaskTypeService` does it too — the tests build their schema from the
  entities, where that constraint does not exist. The page asks first.
- **Labels are capped at 80 characters** (`DayTask.LABEL_MAX`), non-blank, and
  not unique: doing the same thing twice in a day is not an error.
- **Dates are `yyyy-mm-dd`**, from 2020 to a year ahead. Further either way is a
  typo, not a plan. A read asks for a range and gets a year at most.
- **`PATCH` with no body flips `done`.** The server decides the new value from
  what it holds, so two devices cannot talk each other back into the old state.
  Steps on a pursuit already work this way.
- **One request feeds every view.** `DaysProvider` loads this month widened to
  cover the whole current week — that week can start in the month before — and
  the habit grid, the week cards and today's list all read from it. No view
  fetches on its own.
- **The grid's rows are the types the month actually used**, not all 22 on
  offer. A type never logged is not a habit being failed at, and rows of empty
  squares say nothing. A type logged but never completed still gets a row — it
  was attempted. With nothing logged at all the month view drops the grid card
  entirely rather than frame an empty grid, and the analysis card says so.
- **The habit grid is read-only.** A cell shows whether a task of that type is
  done that day; logging happens in today's list. Ticking a cell would have to
  invent a task to represent, and unticking one would have to guess which task
  the user meant when a day holds several of that type.
- **The streak counts back from today** over days with at least one task done.
  An untouched today does not break it — the run is standing, not ended. Only
  the loaded range can be counted, so a longer run reads `12+` rather than a
  number the data cannot back up.

### Recurring tasks (routines)

Managed in the "Routine" section of the task types page, since every routine
is filed under a type. A routine is **only a template**: each day it runs on
gets an ordinary `day_tasks` row with a `routine_id`, so the habit grid, the
week cards and the streak read them without knowing routines exist.

- **Schedules:** every day, chosen weekdays, the 1st, the last day, a day of
  the month (the 31st falls back to the last day of a short month), every N
  days (counted from the start date), and every N weeks on chosen weekdays
  (counted from the start date's Sunday-first week). Weekdays are 0–6, Sunday
  first, stored as a bitmask. A routine starts on the day it is created.
- **Days are filled in on read.** `GET /api/day-tasks` first gives every day
  from the routine's last fill up to today its copies, unticked — including
  days the app was never opened, so a missed day is a gap in the grid rather
  than a blank. `generated_through` makes each day filled **once**: a copy
  deleted by hand is not put back. Backfill stops at **62 days**, and future
  days are never filled, so the week view shows nothing ahead of today.
- **Today is the client's.** Reads and routine writes send `?today=`, because
  the day turns over where the user is. A date more than a day off the
  server's clock is refused as a wrong clock.
- **Edits reach today only if it is untouched.** Past days keep what they had.
  Today's copy follows an edit — or goes, if the new schedule no longer
  includes today — unless it has been ticked or renamed (`day_tasks.edited`).
  A touched copy is the user's.
- **Removing a routine** takes today's untouched copy; every other copy stays
  as a plain task (`routine_id` set null). Deleting a custom task type takes
  its routines along with its tasks.
- Up to **50** routines per account. Routine copies carry a small repeat icon
  in today's list.

#### Goal links

A routine can count toward one goal — "Put 500 aside, monthly" toward a savings
goal, "Eat clean, daily" toward a nutrition goal. Picked under "Counts toward"
in the routine modal; `routines.pursuit_id`, added in `V7`. The rules live in
`GoalLinks`, which depends on repositories only so the day, pursuit and routine
services can all use it without depending on each other.

- **Ticking a copy pays a money goal.** It ticks the goal's next unpaid payment
  step, which moves the balance. With no unpaid step left it adds the routine's
  own optional `amount` instead; with neither, the tick pays nothing.
- **Unticking undoes exactly that.** The copy remembers what it paid
  (`day_tasks.paid_step_id` or `paid_amount`), so an untick reverses that and
  nothing else. A step already unticked on the goal card is left alone, and the
  balance clamps at zero as it does everywhere.
- **Growth goals and dreams are read, not written.** Their link pays nothing;
  it only feeds the record below. An `amount` on one is refused.
- **Every goal response carries `habits`:** each linked routine with `done` and
  `due` over the last **30 days**, a `streak` of consecutive runs ticked (an
  unticked today does not break it), `dueToday` and `lastMissed`. Counted from
  the routine's copies, so it reaches back only as far as the 62-day backfill.
  The card shows them in a "Habits" block.
- **Runs show up among the steps.** Every goal response also carries `runs`:
  the linked routines' day copies, each appearing on the card the day it is
  filled in. All unticked ones are listed, plus the last **3** ticked per
  routine, newest first, so a daily task stays a short list. A run is the day
  task itself — ticking it on the card ticks it in that day's list, and the
  other way round. Runs are **shown, not counted**: a daily task never
  finishes, so the progress bar stays with the steps that were written down.
- **A money goal lists a run only when it is a payment of its own.** While an
  unpaid payment step is waiting, the tick goes to that step and the run is not
  listed twice. With none left, the run appears as a step for the routine's
  `amount`.
- **`GET /api/pursuits` takes `?today=`** and fills in the routines first, so a
  habit counts today's copy even when the days have not been read yet. Write
  responses count from the server's today.
- **A goal changes from outside its own page.** So each `PursuitsProvider`
  fetches again, quietly, whenever a linked routine or one of its copies
  changes. All three areas refetch, not only the one the goal is in.
- **Deleting a goal unlinks its routines** rather than deleting them — the task
  is still worth a tick. Removing a payment step clears it from the copy that
  paid it; the money stays in the balance.

## Pursuits — savings and self-improvement

A **pursuit** is anything worked towards over time. Two pages are built on the
same machinery and differ only in the kinds on offer and the copy around them:

| Page | Area | Kinds |
| --- | --- | --- |
| `#/savings` | `SAVINGS_AREA` (`frontend/src/data/savings.ts`) | saving, investment, debt, bills |
| `#/self-improvement` | `GROWTH_AREA` (`frontend/src/data/growth.ts`) | learning, training, nutrition, reading, mind, creative, career, social, health |
| `#/dreams` | none — see below | none |

Everything else is shared and lives in `frontend/src/pages/pursuits/` — `PursuitPage`
(header, stats, filter, grid, empty screen), `PursuitCard` and `PursuitModal`.
**A third area should be a `PursuitArea` config plus a two-line page, never
another copy of the card and grid.** The area config carries the page copy as
well as the kinds, so the two pages read differently without branching.

State: one `PursuitsProvider` component, mounted once per area with that area's
own context object (`SavingsContext`, `GrowthContext`, `DreamsContext`) and its
`area` prop, so the lists never see each other. `useSavings()`, `useGrowth()`
and `useDreams()` are one-line wrappers.

- **Each provider loads and saves through `/api/pursuits?area=`.** Writes wait
  for the server and apply what it returns — a contribution comes back with
  the clamped balance, a toggled step with the state the server settled on —
  rather than guessing locally.
- **Every action returns `Promise<Result>`.** The provider runs the cheap
  checks first so a typo gets an instant answer; the server repeats all of
  them and has the final word.
- **A card runs one write at a time.** While one is in flight its buttons are
  disabled, so a double click cannot send a step or a contribution twice.
- **The empty screen waits for the load.** Until the list arrives, "nothing
  yet" is a guess, so the page shows a loading line — or the error with a
  retry — instead of the welcome.

**Rules:**

- **Kinds are a closed list per area.** Savings has four, and **each one is a
  card on the stats row** — two that grow what you have, two that shrink what
  you owe. Adding a fifth adds a stat card, so it has to earn one. There is no
  `dream` kind: dreams have their own page, where they get a picture instead of
  a price. Growth has nine, mirroring the categories the
  day is already scored against — its icons and colours are lifted straight
  from the matching `DEFAULT_TASK_TYPES` entries so a growth goal and its task
  type read as the same thing.
- A pursuit is **a name, a kind, a start date and a target date**. Areas with
  `money: true` also carry a target amount and a running balance; the growth
  page does not, because a bench press has no price.
- **Names are capped at 40 characters** (`PURSUIT_NAME_MAX`), non-blank and
  unique case-insensitively *within their area*. Steps are capped at 60
  (`STEP_NAME_MAX`) and are unique within their own pursuit only.
- The start date **defaults to today but stays editable** — people file things
  they started months ago. The target defaults to `DEFAULT_TARGET_MONTHS` ahead
  and cannot land before the start; both the `min`/`max` on the inputs and
  `add` enforce that.
- **Creation happens in a modal**, not inline on the page like task types do.
  The name field is first, before the kind picker — you know what you're after
  before you know which box it goes in.
- **Editing reuses that modal**, opened from the pencil on a card and filled
  with the goal as it is. Everything the create form set can change — name,
  kind, dates, target amount, a dream's icon and picture — **except the area**
  (a goal does not move between pages) **and the balance**, which only moves
  through contributions so an edit cannot quietly rewrite how much has gone in.
  Steps are untouched; they are edited on the card.
- `PATCH /api/pursuits/{id}` takes **the whole form, not a diff**: a blank
  image or target clears it. A goal may keep its own name; taking another
  goal's name in the same area is refused, case-insensitively. Every check
  runs before anything is written, so a rejected edit changes nothing.
- **Steps are added after creation**, from the pursuit's own card. They are the
  rungs: 70kg, 75kg, 80kg, or learn CI, learn CD, wire up Actions, deploy to
  the VPS. Progress is steps done over steps total; no steps means 0%.
- **Money steps are payments, never words.** Every savings kind — saving,
  investment, debt, bills — lays its goal out as amounts: put aside 500 a
  month, and a 6000 target becomes twelve steps of 500. A step carries either a
  `label` (growth, dreams) or an `amount` (money areas), never both; the
  server refuses the wrong one for the area, and a CHECK constraint backs it.
- **Payments are added as amount × count**, so 500 × 12 is one request
  (`count` 1–60, a goal holds up to 120 steps). Identical payments are fine;
  worded steps are still unique within their goal.
- **Ticking a payment moves its money.** Ticking adds the amount to the
  balance, unticking takes it back out, clamped at zero like any
  contribution. The free contribution field stays for amounts that match no
  step. **Removing a ticked payment keeps its money** — the step was the plan,
  the money is already put aside; a negative contribution takes it back out.
- **Money still wins the bar.** With a target, the bar and "done" come from the
  balance, and the payments read as "3 of 12 payments made". Without one, the
  payments drive the bar. The planned total is compared to the target as a
  hint — "€1,000 more planned than the target", "€500 of the target not
  planned yet" — and never blocks anything.
- Dates are stored as **`yyyy-mm-dd` strings**, the format `<input type="date">`
  speaks. Parse them with `parseDateInput` (`frontend/src/lib/date.ts`) and never with
  `new Date(value)` — that reads them as UTC and loses a day west of Greenwich.

**Money** (savings only, gated on `PursuitArea.money`):

- **Currency is per account**: EUR, USD, GBP, CHF or RSD, picked on the
  profile's Account tab and stored on `users.currency` (default EUR, so every
  account from before the setting stays in euros). It rides on the account
  rather than the profile settings because every page that shows money needs
  it, and the session already holds the account.
- **Switching relabels, it never converts.** 500 in euros becomes 500 in
  pounds; there are no exchange rates anywhere in the app. The picker says so.
- **Every amount goes through `useMoney()`** (`frontend/src/pursuits/useMoney.ts`),
  which formats in the account's currency and gives the field prefix. Nothing
  hardcodes a symbol or a locale — `formatMoney` and `currencySymbol` in
  `frontend/src/data/pursuits.ts` take the currency explicitly. The list is
  closed on both ends: `CURRENCIES` on the client, the `Currency` enum plus a
  CHECK constraint on the server. Adding one means all three.
- **Its own endpoint**, `PATCH /api/account/currency`, so the picker does not
  resend name and email. An unknown code is refused by name: "Pick one of
  EUR, USD, GBP, CHF, RSD."
- Both amounts are **optional**. A goal with no target still takes
  contributions and just shows a running total.
- **A money goal measures itself in money.** When `target > 0` the progress bar
  and the "done" state come from the balance. With no target there is nothing
  to measure against, so the head reads "€2,400 put aside" and the bar is
  hidden rather than pinned at zero.
- `contribute` **adds a delta rather than setting a balance** — that is what
  the card's field does. A negative corrects a mistake, and the balance clamps
  at zero, so there is no way to end up owing your own savings goal.
- Amounts are validated in `add` and `contribute`, not just in the inputs:
  finite, non-negative, and under `MAX_AMOUNT`. Anything bigger is a paste
  accident, not a savings goal.
- Overshooting is allowed and shown — putting aside more than the target is a
  real thing that happens, not an error.
- **The stats row is one card per kind**, showing what has gone in against that
  kind's combined target. `statLabel` supplies the heading because it is not
  derivable — "Saving" becomes "Saved", "Investment" becomes "Invested".
- **`spend` kinds are never green.** Bills are money that leaves and stays
  gone, so their stat percentage renders muted (`deltaTone="neutral"`) and
  their progress bar keeps the kind colour when complete instead of turning
  gain-green. Paying more bills is progress; it is not profit. Any future
  outflow kind must set `spend` for the same reason.

**Empty state:** each page has a dedicated empty screen rather than an empty
grid. It introduces the **first three kinds only** (`EMPTY_KINDS_SHOWN`), both
in the tilted tile trio and the strip below the call to action — an area with
nine kinds would otherwise turn its own welcome into a menu. Order the kinds so
the three most representative come first.

## Dreams

`#/dreams` shares the pursuit **store** but not the pursuit **page**. It has no
kinds — a dream house and a dream sabbatical are not usefully different
categories — so the kind picker, the tint and the whole filter strip are gone.
What distinguishes a dream is the picture of it, so the card leads with one.

- A dream is **a name, an icon, an optional image, and dates with steps** like
  any other pursuit. `Pursuit.kind` is simply absent; `icon` and `image` are
  set instead. One `PursuitsProvider` still holds it, mounted on
  `DreamsContext`.
- The icon is **required and always the fallback**: shown when there is no
  image, and swapped back in when a given image fails to load, so a dead link
  degrades instead of leaving a hole in the grid.
- Targets default to twice `DEFAULT_TARGET_MONTHS` — a dream a year out is
  normal, six months is not.

### Image addresses — the rules that make this safe

Users paste arbitrary URLs. That is fine here, and it stays fine only while all
three of these hold:

1. **https only.** `safeImageUrl` (`frontend/src/data/pursuits.ts`) parses with `new
   URL()` and returns the value only for `https:`. `add` re-checks before
   storing, so nothing else can reach state. `javascript:` never executes from
   an `<img src>` in any current browser, but it is blocked here so it cannot
   leak somewhere it would.
2. **Rendered as `<img src>` and nowhere else.** Never an `href`, a `style`, a
   CSS `url()`, a `srcdoc`, or a background. The scheme check is what makes
   `src` safe; those other sinks have different rules and would void it.
3. **`referrerPolicy="no-referrer"`** on every such `<img>`. Loading a
   third-party image already hands that host the user's IP and user-agent —
   there is no reason to hand it the page they were on as well.

Rule 1 is applied **twice**: `safeImageUrl` on the client, and again in
`PursuitService.imageFor` before anything reaches MySQL. The server does not
trust the client's check, because it cannot — a request can be made without
one.

There is still **no SSRF surface**. The API stores the address and hands it
back; nothing we run ever fetches it. That holds only while it stays true, so
any future feature that resolves one of these URLs server-side — a thumbnail, a
preview, a health check — needs its own allowlist before it ships.

The deployment should carry a `Content-Security-Policy` with `img-src https:`
as the backstop. No CSP is set today — Vite's dev server and the app's inline
styles would need working through first.

## Profile & notifications

`#/profile` has two tabs behind one `SegmentedToggle`: **Account** and
**Notifications**.

**Account** holds exactly what the auth screens ask for and nothing more —
name, email, password — plus the "keep me signed in" preference, a sign-out
and a sign-out-everywhere. Name and email live on the session's `user`:
`saveAccount` sends them to `PATCH /api/account` and writes what the server
stored back through `updateUser`, so the Jarvis greeting follows the name.
Changing the email needs the current password; the form shows that field only
once the address actually differs.

The password form checks locally first — at least `PASSWORD_MIN` characters,
different from the current one, typed the same twice — then
`POST /api/account/password` checks again and changes the hash. That retires
every token issued before, so other devices are signed out; this one carries
on with the fresh token the response returns.

"Keep me signed in" belongs to the device, not the account. On, the token is
kept in `localStorage`; off, in `sessionStorage`, which ends with the tab and
is not shared with other tabs. The server's `keepSignedIn` profile field is not
used by the frontend.

**Notifications** is a list of individual reminders, each with its own switch.

- Reminders are defined in `DEFAULT_REMINDERS` (`frontend/src/data/reminders.ts`) and
  sorted into three groups by `REMINDER_GROUPS` — money, days, account.
- A reminder is either **scheduled** or **event-driven** (`scheduled: false`).
  Scheduled ones expose daily / weekly / monthly plus a day and a time; event
  ones ("Streak at risk", "Security alerts") fire when the thing happens and so
  show their trigger instead of controls. Only the switch applies to both.
- **Monthly reminders stop at the 28th** (`MONTH_DAY_MAX`) so every month has
  the day. "Last day of the month" would need its own value, not a number.
- Times are 24-hour `"HH:MM"` strings — what `<input type="time">` speaks.
- `paused` is the master switch. It dims every row and stops delivery but does
  **not** turn the individual reminders off, so unpausing restores exactly what
  was set before.

**`NotificationCard`** (`frontend/src/components/`) is the reminder as the user sees it:
tinted left rail, glow bleeding in from that edge, icon tile, title, body and
the schedule line. It takes a `color` and drives everything off it through the
`--tint` custom property, so a reminder's own colour carries into its
notification. The profile page renders one live as a preview of the first
enabled reminder, `muted` while paused. It is the component to reuse when
reminders actually get delivered in-app.

## Known gaps

- **Part of the frontend is not wired to the backend yet.** Sign-in, custom
  task types, day tasks, goals and the account half of the profile are. Goals
  are too. Reminders and channels still live in `ProfileProvider` state; they
  vanish on reload and reset when another account signs in. Every consumer
  reads through `useProfile()`, so only the provider needs to change.
- **No password reset or email verification.** Both need outgoing email.
  Apple and Google sign-in were removed from the auth screens until OAuth
  exists.
- **Three lists are mirrored across the split** and have to stay in step:
  `DEFAULT_TASK_TYPES`' labels *and ids* (`TaskTypeDefaults.DEFAULT_LABELS` and
  `DEFAULT_KEYS`), `CUSTOM_COLORS`, and `DEFAULT_REMINDERS`' ids
  (`ReminderDefaults`). The server needs the labels to enforce uniqueness
  against the defaults, the ids because a day task names its type with one, the
  colours because it assigns them, and the reminder ids because it stores the
  settings those ids key. Everything else about them — icons, copy, groups —
  stays on the client, which is the only place it is read.
- Every sidebar item now has a page. The navbar's bell, search and settings
  buttons are still inert on purpose rather than dead links.
- **No `Content-Security-Policy` is set.** See the dreams section — the image
  rules hold without one, but a CSP is the backstop worth adding at deploy.
- **Nothing actually sends a reminder.** The notifications tab configures them;
  there is no scheduler, no push registration and no email. `channels` is a
  preference, not a subscription.
- Pursuits carry no amounts, contributions, weights or currency. The card
  shows step progress and time remaining only.
- Steps are a flat list. Nothing nests, and nothing links a growth goal to the
  task type it belongs to.
- **The whole dashboard now reads the API.** `useMonthData` and `useWeekData`
  are pure functions of the tasks `DaysProvider` holds, and the mock seed data
  is gone. `frontend/src/lib/seeded.ts` survives for the welcome screen's
  waveform only. A new account therefore sees an empty grid and empty week
  cards, which is correct and looks emptier than the old screenshots.
- **Nothing tracks mood.** The week cards used to show Energy, Focus and
  Motivation from seeded noise; they are gone rather than faked. A daily
  check-in — rating those per day and storing them — is a feature of its own.
  `MetricRow` is kept, unused, for when it lands.
- The Vision UI design system bundle the original artboard imported
  (`_ds/vision-ui-dashboard-design-system-aefacb…`) is not in this repo. Every
  component in `frontend/src/components/` was rebuilt from the artboard's inline styles.

## Voice

The welcome screen speaks its greeting through the Web Speech API
(`frontend/src/lib/speech.ts`). Two constraints worth remembering:

- Browsers block speech until the document has user activation. A cold load of
  `#/` is usually silent until the first click; the screen detects this and
  offers an "Enable voice" affordance. Activation is sticky, so `#/boot` after
  sign-in reliably speaks.
- The route hand-off waits for **both** typing and speech to finish. Advancing
  on the typing timer alone cuts the greeting off mid-sentence.

Greeting windows, local time: **05:00–11:59** Good morning · **12:00–17:59**
Good day · **18:00–04:59** Good evening.
