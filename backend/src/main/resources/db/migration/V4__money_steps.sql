-- Money steps. A savings goal is laid out as payments - a 6000 target as
-- twelve steps of 500 - so a step in a money area carries an amount instead of
-- a label, and ticking it moves that amount into the balance.
--
-- Twelve steps of 500 are twelve identical rows, so the per-goal unique label
-- goes. Growth and dream steps are still unique within their goal; the service
-- enforces that, as it already did before this key existed.

-- The foreign key on pursuit_id leans on the unique index today, so it needs
-- its own before that one can be dropped.
ALTER TABLE pursuit_steps
  ADD KEY ix_step_pursuit (pursuit_id, sort_order);

ALTER TABLE pursuit_steps
  DROP INDEX uk_step_label;

ALTER TABLE pursuit_steps
  MODIFY label VARCHAR(60) NULL,
  ADD COLUMN amount DECIMAL(15, 2) NULL AFTER label,
  -- A step is words or money. Never both, never neither.
  ADD CONSTRAINT ck_step_label_or_amount CHECK ((label IS NULL) <> (amount IS NULL));
