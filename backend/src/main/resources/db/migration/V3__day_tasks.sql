-- What the dashboard scores: one row per task on one day.
--
-- The client names a type with a single string - 'deep' for a built-in, '7'
-- for a custom one - but the two are stored apart, so the custom half can be a
-- real foreign key. Deleting a custom type therefore takes its tasks with it,
-- which is the rule PROJECT.md states; the service deletes them too, because
-- the tests build this schema from the entities and never see this constraint.
CREATE TABLE day_tasks (
  id             BIGINT      NOT NULL AUTO_INCREMENT,
  user_id        BIGINT      NOT NULL,
  custom_type_id BIGINT      NULL,
  -- A DEFAULT_TASK_TYPES id, mirrored server-side in TaskTypeDefaults.
  default_key    VARCHAR(20) NULL,
  label          VARCHAR(80) NOT NULL,
  -- The day it counts towards, not when it was typed in. yyyy-mm-dd, the
  -- format <input type="date"> and the rest of this schema speak.
  logged_on      DATE        NOT NULL,
  done           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Every read is one account over a date range.
  KEY ix_day_task_user_day (user_id, logged_on),
  CONSTRAINT fk_day_task_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_day_task_type FOREIGN KEY (custom_type_id) REFERENCES custom_task_types (id) ON DELETE CASCADE,
  -- Exactly one of the two type columns. Never both, never neither.
  CONSTRAINT ck_day_task_type CHECK ((custom_type_id IS NULL) <> (default_key IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
