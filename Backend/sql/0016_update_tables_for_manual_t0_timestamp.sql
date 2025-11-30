-- -- 0016_update_tables_for_manual_t0_timestamp.sql
-- BEGIN;

-- -- Remove manual name fields
-- ALTER TABLE photo_sessions DROP COLUMN IF EXISTS temp_photo_name;
-- ALTER TABLE attendance     DROP COLUMN IF EXISTS photo_name;

-- -- Remove unique constraint on temp_photo_name
-- ALTER TABLE photo_sessions
--   DROP CONSTRAINT IF EXISTS uniq_event_photo;

-- COMMIT;

-- ============================================
-- migrations/20250807_add_event_qrcode_unique.sql
-- ============================================
-- BEGIN;

-- -- Ensure one photo_session per event + QR code
-- ALTER TABLE photo_sessions
--   ADD CONSTRAINT uniq_event_qrcode
--     UNIQUE (event_id, qrcode_id);

-- COMMIT;
