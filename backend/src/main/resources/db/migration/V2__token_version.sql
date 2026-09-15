-- Every JWT carries the token version its account had when it was issued, and
-- the auth filter refuses any token whose version is no longer current. Bumping
-- this column (password change, sign out everywhere) retires every older token.
ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0;
