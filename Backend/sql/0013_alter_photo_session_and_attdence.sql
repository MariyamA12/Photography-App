-- -- ensure temp_photo_name is unique per event
-- ALTER TABLE photo_sessions
--   ADD CONSTRAINT uniq_event_photo
--     UNIQUE (event_id, temp_photo_name);

-- -- speed up attendance upserts
-- CREATE UNIQUE INDEX ON attendance(student_id, event_id);

-- ALTER TABLE attendance
-- ADD COLUMN photo_name TEXT;

-- migrations/20250802_add_student_ids_to_attendance.sql
-- ALTER TABLE attendance
--   ADD COLUMN student_ids INTEGER[];

-- migrations/20250802_add_unique_index_attendance.sql

-- ALTER TABLE attendance
--   ADD CONSTRAINT attendance_event_session_unique
--     UNIQUE (event_id, photo_session_id);
