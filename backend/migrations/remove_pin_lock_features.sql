-- Remove pin and lock columns from threads table
ALTER TABLE threads
DROP COLUMN IF EXISTS is_pinned,
DROP COLUMN IF EXISTS is_locked;