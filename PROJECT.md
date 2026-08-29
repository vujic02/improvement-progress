# Kaizen — project notes

Working notes for decisions that aren't obvious from the code. Rules here are
the source of truth; if the code and this file disagree, the code is the bug.

## Naming

Two names, and they are **not** interchangeable. Both live in `src/lib/brand.ts`
and nothing should hardcode either one again.

| Constant | Value | Used for |
| --- | --- | --- |
| `APP_NAME` | Kaizen | The product — wordmarks, breadcrumb roots, tab title, footer |
| `ASSISTANT_NAME` | Jarvis | The voice that greets you on the welcome screen |
| `APP_TAGLINE` | Better by the day | Not used in the UI yet |

Kaizen is Japanese for continuous improvement, which is the whole premise.
Jarvis stays as the assistant persona — renaming one must never rename the
other. The three remaining literal "Jarvis" strings in `src/` are code comments
describing the assistant, which is correct.

## What this is

A personal day/month tracker. Screens live behind a hash router:

| Route | Screen |
| --- | --- |
| `#/` | Jarvis welcome — typed + spoken greeting, then hands off to sign-in |
| `#/signin`, `#/register` | Auth, sharing `AuthLayout` |
| `#/boot` | Second greeting after auth, hands off to the dashboard |
| `#/dashboard` | Month habit grid or week day-cards |
| `#/savings` | Savings, investments and dreams |
| `#/task-types` | Manage task types |
| `#/profile` | Account details and notification settings |

Signed-in pages sit inside `DashboardLayout` (sidebar, navbar, backdrop, footer).

## Task types

Task types are the categories a day gets scored against. They drive the habit
grid rows and the analysis breakdown on the dashboard.

**Rules:**

- **12 defaults**, shipped with the app, in `DEFAULT_TASK_TYPES`
  (`src/data/taskTypes.ts`). They cannot be renamed or removed.
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
`src/components/Icon.tsx` first — the set is hand-drawn, not a library.

## Savings & investing

Goals the user is putting money or time towards. One page, one grid, one modal.

**Rules:**

- **Three kinds only** (`GOAL_KINDS` in `src/data/savings.ts`): `saving` —
  money set aside, `investment` — money put to work, `dream` — the long shot
  with no price tag yet. Anything finer than that is a tag, not a kind; adding
  a fourth means it has to survive that test.
- A goal is **a name, a kind, a start date and a target date**. No amounts yet
  — the page tracks intent and time, not balances.
- **Names are capped at 40 characters** (`GOAL_NAME_MAX`), non-blank and unique
  case-insensitively. Steps are capped at 60 (`STEP_NAME_MAX`) and are unique
  within their own goal only.
- The start date **defaults to today but stays editable** — people file things
  they started months ago. The target defaults to `DEFAULT_TARGET_MONTHS` ahead
  and cannot land before the start; both the `min`/`max` on the inputs and
  `addGoal` enforce that.
- **Creation happens in a modal**, not inline on the page like task types do.
  The name field is first, before the kind picker — you know what you're saving
  for before you know what to call it.
- **Steps are added after creation**, from the goal's own card. Progress is
  just steps done over steps total; a goal with no steps sits at 0%.
- Dates are stored as **`yyyy-mm-dd` strings**, the format `<input type="date">`
  speaks. Parse them with `parseDateInput` (`src/lib/date.ts`) and never with
  `new Date(value)` — that reads them as UTC and loses a day west of Greenwich.

**Empty state:** the page has a dedicated empty screen rather than an empty
grid, and it explains the three kinds. It is the only place they're spelled
out, so keep it in step with `GOAL_KIND_META`.

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

- Reminders are defined in `DEFAULT_REMINDERS` (`src/data/reminders.ts`) and
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

**`NotificationCard`** (`src/components/`) is the reminder as the user sees it:
tinted left rail, glow bleeding in from that edge, icon tile, title, body and
the schedule line. It takes a `color` and drives everything off it through the
`--tint` custom property, so a reminder's own colour carries into its
notification. The profile page renders one live as a preview of the first
enabled reminder, `muted` while paused. It is the component to reuse when
reminders actually get delivered in-app.

## Known gaps

- **Nothing is persisted.** Custom types live in `TaskTypesProvider` state and
  goals in `SavingsProvider`; both vanish on reload. When a backend lands those
  two providers are the only things that need to change — every consumer reads
  through `useTaskTypes()` or `useSavings()`.
- Sidebar items `self` and `goals` have no pages yet. `NAV_ROUTES` in
  `DashboardLayout` maps the ids that do; the rest are inert on purpose rather
  than dead links. The navbar's bell, search and settings buttons are inert for
  the same reason.
- **Nothing actually sends a reminder.** The notifications tab configures them;
  there is no scheduler, no push registration and no email. `channels` is a
  preference, not a subscription.
- Goals carry no amounts, contributions or currency. The card shows step
  progress and time remaining only.
- Dashboard data is mocked and seeded (`src/lib/seeded.ts`) so it looks
  lived-in and stays stable across reloads. `WEEK_TASK_POOL` has one row per
  default type **in the same order** — keep them in step, `useWeekData` indexes
  the pool to pick a type.
- The Vision UI design system bundle the original artboard imported
  (`_ds/vision-ui-dashboard-design-system-aefacb…`) is not in this repo. Every
  component in `src/components/` was rebuilt from the artboard's inline styles.

## Voice

The welcome screen speaks its greeting through the Web Speech API
(`src/lib/speech.ts`). Two constraints worth remembering:

- Browsers block speech until the document has user activation. A cold load of
  `#/` is usually silent until the first click; the screen detects this and
  offers an "Enable voice" affordance. Activation is sticky, so `#/boot` after
  sign-in reliably speaks.
- The route hand-off waits for **both** typing and speech to finish. Advancing
  on the typing timer alone cuts the greeting off mid-sentence.

Greeting windows, local time: **05:00–11:59** Good morning · **12:00–17:59**
Good day · **18:00–04:59** Good evening.
