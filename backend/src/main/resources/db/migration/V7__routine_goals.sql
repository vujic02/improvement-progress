-- Recurring tasks that count toward a goal. "Put 500 aside, monthly" linked
-- to a savings goal pays it when ticked; "Eat clean, daily" linked to a
-- nutrition goal builds that goal's consistency record.
--
-- Deleting the goal unlinks its routines rather than deleting them: paying
-- the electricity bill is still worth a tick without a goal to count toward.
ALTER TABLE routines
  ADD COLUMN pursuit_id BIGINT NULL AFTER default_key,
  -- Money goals only: what a tick puts in when the goal has no unpaid payment
  -- step left to tick.
  ADD COLUMN amount DECIMAL(15, 2) NULL AFTER interval_n,
  ADD KEY ix_routine_pursuit (pursuit_id),
  ADD CONSTRAINT fk_routine_pursuit FOREIGN KEY (pursuit_id) REFERENCES pursuits (id) ON DELETE SET NULL;

-- What ticking this copy paid, so unticking undoes exactly that: the payment
-- step it ticked, or the amount it added. At most one is set.
ALTER TABLE day_tasks
  ADD COLUMN paid_step_id BIGINT NULL AFTER routine_id,
  ADD COLUMN paid_amount DECIMAL(15, 2) NULL AFTER paid_step_id,
  ADD CONSTRAINT fk_day_task_paid_step FOREIGN KEY (paid_step_id) REFERENCES pursuit_steps (id) ON DELETE SET NULL;
