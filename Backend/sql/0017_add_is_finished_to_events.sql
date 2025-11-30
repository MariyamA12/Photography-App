-- 0017_add_is_finished_to_events.sql
BEGIN;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_finished BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
