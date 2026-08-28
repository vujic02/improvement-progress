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
| `#/task-types` | Manage task types |

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

## Known gaps

- **Nothing is persisted.** Custom types live in `TaskTypesProvider` state and
  vanish on reload. When a backend lands, that provider is the only thing that
  needs to change — every consumer reads through `useTaskTypes()`.
- Sidebar items `savings`, `self`, `goals` and `profile` have no pages yet.
  `NAV_ROUTES` in `DashboardLayout` maps the ids that do; the rest are inert on
  purpose rather than dead links.
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
