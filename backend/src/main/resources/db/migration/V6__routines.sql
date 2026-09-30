-- Recurring tasks. A routine is the template - "Read 20 pages, every day",
-- "Gym, Mon/Wed/Fri", "Pay rent, on the 1st" - and each day it runs on gets
-- its own ordinary row in day_tasks, so the habit grid, the week view and the
-- streak read them without knowing routines exist.
--
-- Days are filled in when the account's tasks are read, up to the client's
-- today and at most 62 days back. generated_through is the last day already
-- filled, so every day is filled once: a copy deleted by hand stays deleted.
CREATE TABLE routines (
  id                BIGINT      NOT NULL AUTO_INCREMENT,
  user_id           BIGINT      NOT NULL,
  -- Same split as day_tasks: a custom type's id, or a built-in's key.
  custom_type_id    BIGINT      NULL,
  default_key       VARCHAR(20) NULL,
  label             VARCHAR(80) NOT NULL,
  -- DAILY, WEEKLY, MONTH_FIRST, MONTH_LAST, MONTH_DAY, EVERY_N_DAYS, EVERY_N_WEEKS
  cadence           VARCHAR(16) NOT NULL,
  -- Bit 0 is Sunday, bit 6 Saturday - the numbering JavaScript's getDay uses.
  weekdays          INT         NOT NULL DEFAULT 0,
  day_of_month      INT         NULL,
  interval_n        INT         NULL,
  -- Every-n counts from here, and nothing is filled in before it.
  starts_on         DATE        NOT NULL,
  generated_through DATE        NULL,
  created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_routine_user (user_id),
  CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_routine_type FOREIGN KEY (custom_type_id) REFERENCES custom_task_types (id) ON DELETE CASCADE,
  CONSTRAINT ck_routine_type CHECK ((custom_type_id IS NULL) <> (default_key IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- A copy remembers the routine it came from, so an edit can follow it into
-- today. `edited` marks a copy the user renamed: that one is theirs now, and
-- an edit to the routine leaves it alone. Deleting a routine keeps its past
-- copies as plain tasks.
ALTER TABLE day_tasks
  ADD COLUMN routine_id BIGINT NULL AFTER custom_type_id,
  ADD COLUMN edited BOOLEAN NOT NULL DEFAULT FALSE AFTER done,
  ADD KEY ix_day_task_routine (routine_id, logged_on),
  ADD CONSTRAINT fk_day_task_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE SET NULL;
