-- Rollback guidance for feedback / discount related schema.
-- Run only if you intentionally want to remove these features.
-- This script is destructive for feedback and discount data.

BEGIN;

DROP INDEX IF EXISTS idx_discount_rule_created_at;
DROP INDEX IF EXISTS idx_discount_rule_enabled;
DROP INDEX IF EXISTS idx_feedback_scooter_id;
DROP INDEX IF EXISTS idx_feedback_booking_id;
DROP INDEX IF EXISTS idx_feedback_status;
DROP INDEX IF EXISTS idx_feedback_priority_created_at;
DROP INDEX IF EXISTS idx_feedback_user_id;

ALTER TABLE IF EXISTS feedback DROP CONSTRAINT IF EXISTS fk_feedback_scooter;
ALTER TABLE IF EXISTS feedback DROP CONSTRAINT IF EXISTS fk_feedback_booking;
ALTER TABLE IF EXISTS feedback DROP CONSTRAINT IF EXISTS fk_feedback_user;

DROP TABLE IF EXISTS discount_rule;

ALTER TABLE IF EXISTS feedback DROP COLUMN IF EXISTS priority;
ALTER TABLE IF EXISTS feedback DROP COLUMN IF EXISTS status;

ALTER TABLE IF EXISTS booking DROP COLUMN IF EXISTS applied_discount_rate;
ALTER TABLE IF EXISTS booking DROP COLUMN IF EXISTS applied_discount_type;
ALTER TABLE IF EXISTS booking DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE IF EXISTS booking DROP COLUMN IF EXISTS original_price;

COMMIT;
