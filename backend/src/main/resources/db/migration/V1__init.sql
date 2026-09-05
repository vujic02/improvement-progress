-- Kaizen schema, first cut. Mirrors the rules in the repo's PROJECT.md.
--
-- Collation note: utf8mb4_0900_ai_ci is case-insensitive, so every UNIQUE
-- index below is already the case-insensitive uniqueness PROJECT.md asks for.
-- The services re-check anyway, to return a message instead of a 500.

CREATE TABLE users (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- The 12 DEFAULT_TASK_TYPES ship with the frontend and are not rows. Only the
-- custom ones a user adds live here, capped at CUSTOM_TASK_TYPE_LIMIT (10).
CREATE TABLE custom_task_types (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  user_id    BIGINT      NOT NULL,
  label      VARCHAR(30) NOT NULL,
  icon       VARCHAR(40) NOT NULL,
  color      VARCHAR(32) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_type_label (user_id, label),
  CONSTRAINT fk_task_type_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One table for all three pursuit pages. `area` is what keeps the lists apart,
-- the way a separate context object does on the frontend.
--   SAVINGS  money, no steps, kind is one of saving/investment/debt/bills
--   GROWTH   steps, no money, kind is one of the nine growth kinds
--   DREAMS   steps, no money, no kind at all — icon and image instead
CREATE TABLE pursuits (
  id            BIGINT         NOT NULL AUTO_INCREMENT,
  user_id       BIGINT         NOT NULL,
  area          VARCHAR(16)    NOT NULL,
  name          VARCHAR(40)    NOT NULL,
  kind          VARCHAR(32)             DEFAULT NULL,
  icon          VARCHAR(40)             DEFAULT NULL,
  -- https only, enforced on write. Never rendered anywhere but an <img src>.
  image         VARCHAR(2048)           DEFAULT NULL,
  target_amount DECIMAL(15, 2)          DEFAULT NULL,
  saved_amount  DECIMAL(15, 2)          DEFAULT NULL,
  -- The user-facing dates. DATE, not TIMESTAMP: the client speaks yyyy-mm-dd
  -- and a timezone would cost it a day. Exposed as createdAt / targetAt.
  started_on    DATE           NOT NULL,
  target_on     DATE           NOT NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pursuit_name (user_id, area, name),
  KEY ix_pursuit_area (user_id, area, created_at),
  CONSTRAINT fk_pursuit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pursuit_steps (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  pursuit_id BIGINT      NOT NULL,
  label      VARCHAR(60) NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_step_label (pursuit_id, label),
  CONSTRAINT fk_step_pursuit FOREIGN KEY (pursuit_id) REFERENCES pursuits (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE profile_settings (
  user_id         BIGINT  NOT NULL,
  keep_signed_in  BOOLEAN NOT NULL DEFAULT TRUE,
  -- Master switch. Dims every reminder and stops delivery without turning the
  -- individual ones off, so unpausing restores exactly what was set.
  paused          BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Settings only. A reminder's title, body, icon, colour, group and whether it
-- is scheduled at all are app metadata that ships with the frontend
-- (DEFAULT_REMINDERS); `reminder_key` is the id it joins on. Rows are written
-- for every default at registration so a PATCH never has to create one.
CREATE TABLE reminders (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  user_id      BIGINT      NOT NULL,
  reminder_key VARCHAR(40) NOT NULL,
  enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  cadence      VARCHAR(10) NOT NULL DEFAULT 'monthly',
  weekday      INT         NOT NULL DEFAULT 0,
  -- 1-28 only, so every month has the day. MONTH_DAY_MAX.
  day_of_month INT         NOT NULL DEFAULT 1,
  time_of_day  TIME        NOT NULL DEFAULT '09:00:00',
  PRIMARY KEY (id),
  UNIQUE KEY uk_reminder_key (user_id, reminder_key),
  CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
