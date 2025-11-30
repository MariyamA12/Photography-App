-- -- migrations/0014_clean_attendance_table.sql

-- BEGIN;

-- -- Drop and recreate attendance table
-- DROP TABLE IF EXISTS attendance CASCADE;

-- CREATE TABLE attendance (
--   id               SERIAL PRIMARY KEY,
--   event_id         INTEGER    NOT NULL REFERENCES events(id)       ON DELETE CASCADE,
--   photo_session_id INTEGER    REFERENCES photo_sessions(id)          ON DELETE SET NULL,
--   student_ids      INTEGER[]  NOT NULL,
--   status           VARCHAR(20) NOT NULL CHECK (status IN ('present','absent')),
--   marked_by        INTEGER    REFERENCES users(id)                 ON DELETE SET NULL,
--   timestamp        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   qrcode_id        INTEGER    REFERENCES qrcodes(id)               ON DELETE SET NULL,
--   photo_type       VARCHAR(50) CHECK (
--                       photo_type IN ('individual','group','with_sibling','with_friend')
--                     ),
--   photo_name       TEXT
-- );

-- -- Ensure one attendance record per (event, session)
-- ALTER TABLE attendance
--   ADD CONSTRAINT attendance_event_session_unique
--     UNIQUE (event_id, photo_session_id);

-- COMMIT;
