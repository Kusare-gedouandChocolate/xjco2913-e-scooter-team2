CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(30),
    card_token VARCHAR(128),
    walk_in_customer BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scooter (
    id BIGSERIAL PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    battery_level INT,
    current_location VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental_option (
    id BIGSERIAL PRIMARY KEY,
    duration_label VARCHAR(50) NOT NULL,
    duration_hours INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS booking (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    scooter_id BIGINT NOT NULL,
    rental_option_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    total_price NUMERIC(10, 2),
    start_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_booking_scooter FOREIGN KEY (scooter_id) REFERENCES scooter(id),
    CONSTRAINT fk_booking_rental_option FOREIGN KEY (rental_option_id) REFERENCES rental_option(id)
);

CREATE TABLE IF NOT EXISTS payment (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(32) NOT NULL,
    transaction_no VARCHAR(100) NOT NULL UNIQUE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES booking(id)
);

CREATE TABLE IF NOT EXISTS booking_confirmation (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    confirmation_number VARCHAR(100) NOT NULL UNIQUE,
    confirmed_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_confirmation_booking FOREIGN KEY (booking_id) REFERENCES booking(id)
);

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

CREATE TABLE IF NOT EXISTS reminder_record (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reminder_booking FOREIGN KEY (booking_id) REFERENCES booking(id)
);

CREATE TABLE IF NOT EXISTS overdue_charge_execution_log (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    trigger_type VARCHAR(20) NOT NULL,
    attempt_no INT NOT NULL,
    charge_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(1000),
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_overdue_charge_booking FOREIGN KEY (booking_id) REFERENCES booking(id)
);

CREATE TABLE IF NOT EXISTS overdue_task_execution_log (
    id BIGSERIAL PRIMARY KEY,
    trigger_type VARCHAR(20) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    scanned_count INT NOT NULL DEFAULT 0,
    overdue_count INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    failure_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    error_message VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS damage_event (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    scooter_id BIGINT NOT NULL,
    reported_by_user_id VARCHAR(36),
    damage_level VARCHAR(20),
    description VARCHAR(2000) NOT NULL,
    image_url VARCHAR(1000),
    damage_fee NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_damage_event_booking FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT fk_damage_event_scooter FOREIGN KEY (scooter_id) REFERENCES scooter(id)
);

ALTER TABLE booking ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS base_rental_fee NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS overtime_fee NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS battery_usage_fee NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS damage_fee NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS overtime_minutes BIGINT;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS battery_usage_percent INT;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS damage_reported BOOLEAN;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS auto_charged_amount NUMERIC(10, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS last_overdue_reminder_at TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS applied_discount_type VARCHAR(50);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS applied_discount_rate NUMERIC(5, 2);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(32);
ALTER TABLE booking ADD COLUMN IF NOT EXISTS pickup_code_expires_at TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS pickup_battery_level INT;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS return_battery_level INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_token VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS walk_in_customer BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE booking_confirmation ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(32);
ALTER TABLE booking_confirmation ADD COLUMN IF NOT EXISTS pickup_code_expires_at TIMESTAMP;
ALTER TABLE booking DROP CONSTRAINT IF EXISTS chk_booking_pickup_battery_level;
ALTER TABLE booking DROP CONSTRAINT IF EXISTS chk_booking_return_battery_level;
ALTER TABLE booking ADD CONSTRAINT chk_booking_pickup_battery_level
    CHECK (pickup_battery_level IS NULL OR (pickup_battery_level >= 0 AND pickup_battery_level <= 100));
ALTER TABLE booking ADD CONSTRAINT chk_booking_return_battery_level
    CHECK (return_battery_level IS NULL OR (return_battery_level >= 0 AND return_battery_level <= 100));

UPDATE booking
SET base_rental_fee = COALESCE(original_price, total_price, 0) - COALESCE(discount_amount, 0)
WHERE base_rental_fee IS NULL;

UPDATE booking
SET overtime_fee = COALESCE(overtime_fee, 0),
    battery_usage_fee = COALESCE(battery_usage_fee, 0),
    damage_fee = COALESCE(damage_fee, 0),
    overtime_minutes = COALESCE(overtime_minutes, 0),
    damage_reported = COALESCE(damage_reported, FALSE),
    auto_charged_amount = COALESCE(auto_charged_amount, 0),
    battery_usage_percent = COALESCE(battery_usage_percent,
        CASE
            WHEN pickup_battery_level IS NOT NULL AND return_battery_level IS NOT NULL
                THEN GREATEST(pickup_battery_level - return_battery_level, 0)
            ELSE 0
        END);

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
CREATE INDEX IF NOT EXISTS idx_reminder_record_booking_created_at ON reminder_record(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_overdue_charge_log_booking_created_at ON overdue_charge_execution_log(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_overdue_task_log_started_at ON overdue_task_execution_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_event_created_at ON damage_event(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_event_booking_id ON damage_event(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_discount_rule_rule_type ON discount_rule(rule_type);
