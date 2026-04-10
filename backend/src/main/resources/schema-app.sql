CREATE TABLE IF NOT EXISTS discount_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL,
    discount_rate NUMERIC(5, 2) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    min_completed_bookings INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    booking_id BIGINT,
    scooter_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE booking ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS applied_discount_type VARCHAR(50);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS applied_discount_rate NUMERIC(5, 2);

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS priority VARCHAR(20);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status VARCHAR(20);

UPDATE feedback SET priority = 'LOW' WHERE priority IS NULL;
UPDATE feedback SET status = 'SUBMITTED' WHERE status IS NULL;

ALTER TABLE feedback ALTER COLUMN priority SET DEFAULT 'LOW';
ALTER TABLE feedback ALTER COLUMN status SET DEFAULT 'SUBMITTED';
ALTER TABLE feedback ALTER COLUMN priority SET NOT NULL;
ALTER TABLE feedback ALTER COLUMN status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_priority_created_at ON feedback(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_booking_id ON feedback(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_scooter_id ON feedback(scooter_id);
CREATE INDEX IF NOT EXISTS idx_discount_rule_enabled ON discount_rule(enabled);
CREATE INDEX IF NOT EXISTS idx_discount_rule_created_at ON discount_rule(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uk_discount_rule_rule_type ON discount_rule(rule_type);
