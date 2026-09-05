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
  `maxLength` on the input *and* re-checked in `addCustom`.
- Names must be non-blank and unique, case-insensitively, across defaults and
  custom types together.
- Custom types are removable; removing one frees its slot immediately.

**Colour:** there is no colour picker yet. Each new custom type takes the next
colour from `CUSTOM_COLORS` and wraps around when the list runs out. If a
picker is added later, keep this as the default rather than making the user
choose before they can save.

**Icons:** the create form offers `PICKABLE_ICONS`, a subset of the app's icon
set. Adding an icon to the picker means adding a glyph to
`frontend/src/components/Icon.tsx` first — the set is hand-drawn, not a library.

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
own context object (`SavingsContext`, `GrowthContext`), so the two lists never
see each other. `useSavings()` and `useGrowth()` are one-line wrappers.

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
- **Steps are added after creation**, from the pursuit's own card. They are the
  rungs: 70kg, 75kg, 80kg, or learn CI, learn CD, wire up Actions, deploy to
  the VPS. Progress is steps done over steps total; no steps means 0%.
- **Savings has no steps** (`steps: false`). A savings goal is measured by its
  balance, and a checklist next to that is two answers to the same question —
  so the card shows a number, a bar and a contribution field, and nothing else.
  The store still carries `steps` for every pursuit; the savings card simply
  never renders them.
- Dates are stored as **`yyyy-mm-dd` strings**, the format `<input type="date">`
  speaks. Parse them with `parseDateInput` (`frontend/src/lib/date.ts`) and never with
  `new Date(value)` — that reads them as UTC and loses a day west of Greenwich.

**Money** (savings only, gated on `PursuitArea.money`):

- **Euros, via one constant.** `CURRENCY` and `formatMoney` live in
  `frontend/src/data/pursuits.ts` — nothing else should hardcode a symbol or a locale,
  so switching currency later, or making it a per-user setting, is one edit.
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
name, email, password — plus the "keep me signed in" preference and a sign-out.
The name is **not** stored on the profile: it lives in `SessionProvider`, and
`saveAccount` writes through `setUserName` so the Jarvis greeting follows it.
Email lives in `ProfileProvider`.

The password form **validates and reports back, it does not store anything**.
There is no backend to check the current password against, so "Password
updated." means the form was well-formed, not that anything changed. Rules:
at least `PASSWORD_MIN` characters, different from the current one, and typed
the same twice.

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

- **The frontend is not wired to the backend.** `backend/` persists all of it —
  accounts, custom types, pursuits, steps, reminder settings — but the app has
  not been pointed at it yet. Custom types still live in `TaskTypesProvider`
  state and goals in `PursuitsProvider`, and both still vanish on reload.
  Those providers plus `SessionProvider` are the only things that need to
  change: every consumer reads through `useTaskTypes()`, `useSavings()`,
  `useGrowth()` or `useDreams()`.
- **Two lists are mirrored across the split** and have to stay in step:
  `DEFAULT_TASK_TYPES`' labels and `CUSTOM_COLORS` (`TaskTypeDefaults` on the
  server), and `DEFAULT_REMINDERS`' ids (`ReminderDefaults`). The server needs
  the labels to enforce uniqueness against the defaults and the colours because
  it assigns them; it needs the reminder ids because it stores the settings
  those ids key. Everything else about them — icons, copy, groups — stays on
  the client, which is the only place it is read.
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
- Dashboard data is mocked and seeded (`frontend/src/lib/seeded.ts`) so it looks
  lived-in and stays stable across reloads. `WEEK_TASK_POOL` has one row per
  default type **in the same order** — keep them in step, `useWeekData` indexes
  the pool to pick a type.
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
