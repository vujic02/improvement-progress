-- The currency an account's money goals are shown in. Every existing account
-- was in euros, so the default keeps them exactly as they were.
--
-- Switching relabels the amounts, it never converts them: there are no
-- exchange rates anywhere in the app. The list mirrors the Currency enum.
ALTER TABLE users
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR' AFTER email,
  ADD CONSTRAINT ck_user_currency CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF', 'RSD'));
