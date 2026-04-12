CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(30),
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
