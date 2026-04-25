-- Repeatable demo data for local development.
-- This script assumes schema-app.sql, seed-app.sql, and seed-users.sql already ran.

INSERT INTO rental_option (id, duration_label, duration_hours, price)
SELECT 1, '1h', 1, 500.00
WHERE NOT EXISTS (SELECT 1 FROM rental_option WHERE id = 1);

INSERT INTO rental_option (id, duration_label, duration_hours, price)
SELECT 2, '4h', 4, 1800.00
WHERE NOT EXISTS (SELECT 1 FROM rental_option WHERE id = 2);

INSERT INTO rental_option (id, duration_label, duration_hours, price)
SELECT 3, '1day', 24, 6000.00
WHERE NOT EXISTS (SELECT 1 FROM rental_option WHERE id = 3);

INSERT INTO rental_option (id, duration_label, duration_hours, price)
SELECT 4, '1week', 168, 35000.00
WHERE NOT EXISTS (SELECT 1 FROM rental_option WHERE id = 4);

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at)
SELECT 1, 'Xiaomi M365', 'AVAILABLE', 85, 'Campus Gate A', '2026-03-01 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM scooter WHERE id = 1);

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at)
SELECT 2, 'Ninebot MAX G30', 'IN_USE', 62, 'Library North', '2026-03-01 10:05:00'
WHERE NOT EXISTS (SELECT 1 FROM scooter WHERE id = 2);

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at)
SELECT 3, 'Niu KQi3 Pro', 'MAINTENANCE', 20, 'Service Center', '2026-03-01 10:10:00'
WHERE NOT EXISTS (SELECT 1 FROM scooter WHERE id = 3);

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at)
SELECT 4, 'Segway F40', 'LOCKED', 45, 'Dormitory B', '2026-03-01 10:15:00'
WHERE NOT EXISTS (SELECT 1 FROM scooter WHERE id = 4);

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at)
SELECT 5, 'Okai Neon Pro', 'AVAILABLE', 93, 'Sports Hall', '2026-03-01 10:20:00'
WHERE NOT EXISTS (SELECT 1 FROM scooter WHERE id = 5);

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at)
SELECT 6, 'Xiaomi 4 Pro', 'AVAILABLE', 71, 'Engineering Building', '2026-03-01 10:25:00'
WHERE NOT EXISTS (SELECT 1 FROM scooter WHERE id = 6);

INSERT INTO booking (
    id,
    user_id,
    scooter_id,
    rental_option_id,
    status,
    total_price,
    original_price,
    discount_amount,
    base_rental_fee,
    overtime_fee,
    battery_usage_fee,
    overtime_minutes,
    battery_usage_percent,
    applied_discount_type,
    applied_discount_rate,
    start_time,
    created_at
)
SELECT
    1,
    '11111111-1111-1111-1111-111111111111',
    1,
    1,
    'COMPLETED',
    740.00,
    500.00,
    0.00,
    500.00,
    0.00,
    240.00,
    0,
    12,
    NULL,
    NULL,
    '2026-03-20 10:00:00',
    85,
    71,
    '2026-03-20 09:45:00'
WHERE NOT EXISTS (SELECT 1 FROM booking WHERE id = 1);

INSERT INTO booking (
    id,
    user_id,
    scooter_id,
    rental_option_id,
    status,
    total_price,
    original_price,
    discount_amount,
    base_rental_fee,
    overtime_fee,
    battery_usage_fee,
    overtime_minutes,
    battery_usage_percent,
    applied_discount_type,
    applied_discount_rate,
    start_time,
    pickup_code,
    pickup_code_expires_at,
    created_at
)
SELECT
    2,
    '22222222-2222-2222-2222-222222222222',
    2,
    2,
    'AWAITING_PICKUP',
    1800.00,
    1800.00,
    0.00,
    1800.00,
    0.00,
    0.00,
    0,
    0,
    NULL,
    NULL,
    '2026-03-21 08:30:00',
    '220002',
    '2026-03-21 10:05:00',
    '2026-03-21 08:00:00'
WHERE NOT EXISTS (SELECT 1 FROM booking WHERE id = 2);

INSERT INTO booking (
    id,
    user_id,
    scooter_id,
    rental_option_id,
    status,
    total_price,
    original_price,
    discount_amount,
    base_rental_fee,
    overtime_fee,
    battery_usage_fee,
    overtime_minutes,
    battery_usage_percent,
    applied_discount_type,
    applied_discount_rate,
    start_time,
    created_at
)
SELECT
    3,
    '44444444-4444-4444-4444-444444444444',
    5,
    4,
    'PENDING_PAYMENT',
    29750.00,
    35000.00,
    5250.00,
    29750.00,
    0.00,
    0.00,
    0,
    0,
    'FREQUENT_USER',
    15.00,
    '2026-03-25 12:00:00',
    '2026-03-25 11:30:00'
WHERE NOT EXISTS (SELECT 1 FROM booking WHERE id = 3);

INSERT INTO booking (
    id,
    user_id,
    scooter_id,
    rental_option_id,
    status,
    total_price,
    original_price,
    discount_amount,
    base_rental_fee,
    overtime_fee,
    battery_usage_fee,
    overtime_minutes,
    battery_usage_percent,
    applied_discount_type,
    applied_discount_rate,
    start_time,
    pickup_battery_level,
    return_battery_level,
    created_at
)
SELECT
    4,
    '55555555-5555-5555-5555-555555555555',
    6,
    3,
    'CANCELLED',
    6000.00,
    6000.00,
    0.00,
    6000.00,
    0.00,
    0.00,
    0,
    0,
    NULL,
    NULL,
    '2026-03-22 14:00:00',
    '2026-03-22 13:40:00'
WHERE NOT EXISTS (SELECT 1 FROM booking WHERE id = 4);

INSERT INTO booking (
    id,
    user_id,
    scooter_id,
    rental_option_id,
    status,
    total_price,
    original_price,
    discount_amount,
    base_rental_fee,
    overtime_fee,
    battery_usage_fee,
    overtime_minutes,
    battery_usage_percent,
    applied_discount_type,
    applied_discount_rate,
    start_time,
    pickup_battery_level,
    return_battery_level,
    created_at
)
SELECT
    5,
    '11111111-1111-1111-1111-111111111111',
    5,
    2,
    'COMPLETED',
    2535.00,
    1800.00,
    0.00,
    1800.00,
    135.00,
    600.00,
    18,
    30,
    NULL,
    NULL,
    '2026-03-28 18:30:00',
    93,
    58,
    '2026-03-28 18:00:00'
WHERE NOT EXISTS (SELECT 1 FROM booking WHERE id = 5);

INSERT INTO booking (
    id,
    user_id,
    scooter_id,
    rental_option_id,
    status,
    total_price,
    original_price,
    discount_amount,
    base_rental_fee,
    overtime_fee,
    battery_usage_fee,
    overtime_minutes,
    battery_usage_percent,
    applied_discount_type,
    applied_discount_rate,
    start_time,
    pickup_code,
    pickup_code_expires_at,
    picked_up_at,
    pickup_battery_level,
    created_at
)
SELECT
    6,
    '33333333-3333-3333-3333-333333333333',
    1,
    1,
    'IN_PROGRESS',
    500.00,
    500.00,
    0.00,
    500.00,
    0.00,
    0.00,
    0,
    0,
    NULL,
    NULL,
    '2026-03-29 09:00:00',
    '220006',
    '2026-03-29 10:50:00',
    '2026-03-29 09:00:00',
    81,
    '2026-03-29 08:45:00'
WHERE NOT EXISTS (SELECT 1 FROM booking WHERE id = 6);

INSERT INTO payment (id, booking_id, user_id, amount, payment_method, payment_status, transaction_no, paid_at, created_at)
SELECT 1, 1, '11111111-1111-1111-1111-111111111111', 740.00, 'CARD', 'SUCCESS', 'TXN-20260320-0001', '2026-03-20 09:50:00', '2026-03-20 09:50:00'
WHERE NOT EXISTS (SELECT 1 FROM payment WHERE id = 1);

INSERT INTO payment (id, booking_id, user_id, amount, payment_method, payment_status, transaction_no, paid_at, created_at)
SELECT 2, 2, '22222222-2222-2222-2222-222222222222', 1800.00, 'WALLET', 'SUCCESS', 'TXN-20260321-0002', '2026-03-21 08:05:00', '2026-03-21 08:05:00'
WHERE NOT EXISTS (SELECT 1 FROM payment WHERE id = 2);

INSERT INTO payment (id, booking_id, user_id, amount, payment_method, payment_status, transaction_no, paid_at, created_at)
SELECT 3, 5, '11111111-1111-1111-1111-111111111111', 2535.00, 'CARD', 'SUCCESS', 'TXN-20260328-0003', '2026-03-28 18:05:00', '2026-03-28 18:05:00'
WHERE NOT EXISTS (SELECT 1 FROM payment WHERE id = 3);

INSERT INTO payment (id, booking_id, user_id, amount, payment_method, payment_status, transaction_no, paid_at, created_at)
SELECT 4, 6, '33333333-3333-3333-3333-333333333333', 500.00, 'CARD', 'SUCCESS', 'TXN-20260329-0004', '2026-03-29 08:50:00', '2026-03-29 08:50:00'
WHERE NOT EXISTS (SELECT 1 FROM payment WHERE id = 4);

INSERT INTO booking_confirmation (id, booking_id, confirmation_number, confirmed_at, pickup_code, pickup_code_expires_at)
SELECT 1, 1, 'CONF-20260320-1001', '2026-03-20 09:51:00', '220001', '2026-03-20 11:50:00'
WHERE NOT EXISTS (SELECT 1 FROM booking_confirmation WHERE id = 1);

INSERT INTO booking_confirmation (id, booking_id, confirmation_number, confirmed_at, pickup_code, pickup_code_expires_at)
SELECT 2, 2, 'CONF-20260321-1002', '2026-03-21 08:06:00', '220002', '2026-03-21 10:05:00'
WHERE NOT EXISTS (SELECT 1 FROM booking_confirmation WHERE id = 2);

INSERT INTO booking_confirmation (id, booking_id, confirmation_number, confirmed_at, pickup_code, pickup_code_expires_at)
SELECT 3, 5, 'CONF-20260328-1003', '2026-03-28 18:06:00', '220005', '2026-03-28 20:05:00'
WHERE NOT EXISTS (SELECT 1 FROM booking_confirmation WHERE id = 3);

INSERT INTO booking_confirmation (id, booking_id, confirmation_number, confirmed_at, pickup_code, pickup_code_expires_at)
SELECT 4, 6, 'CONF-20260329-1004', '2026-03-29 08:51:00', '220006', '2026-03-29 10:50:00'
WHERE NOT EXISTS (SELECT 1 FROM booking_confirmation WHERE id = 4);

INSERT INTO feedback (id, user_id, category, content, booking_id, scooter_id, priority, status, created_at)
SELECT 1, '11111111-1111-1111-1111-111111111111', 'SUGGESTION', 'Please add more pickup points near the library.', 1, 1, 'LOW', 'RESOLVED', '2026-03-20 16:00:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 1);

INSERT INTO feedback (id, user_id, category, content, booking_id, scooter_id, priority, status, created_at)
SELECT 2, '22222222-2222-2222-2222-222222222222', 'COMPLAINT', 'The scooter battery dropped too quickly during the ride.', 2, 2, 'HIGH', 'IN_PROGRESS', '2026-03-21 13:20:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 2);

INSERT INTO feedback (id, user_id, category, content, booking_id, scooter_id, priority, status, created_at)
SELECT 3, '55555555-5555-5555-5555-555555555555', 'BUG_REPORT', 'The payment page timed out once before the order was cancelled.', 4, 6, 'HIGH', 'SUBMITTED', '2026-03-22 14:15:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 3);

INSERT INTO feedback (id, user_id, category, content, booking_id, scooter_id, priority, status, created_at)
SELECT 4, '44444444-4444-4444-4444-444444444444', 'OTHER', 'Weekly pass discount looks good and checkout was smooth.', 3, 5, 'LOW', 'RESOLVED', '2026-03-25 12:30:00'
WHERE NOT EXISTS (SELECT 1 FROM feedback WHERE id = 4);

UPDATE booking b
SET completed_at = b.start_time + make_interval(hours => COALESCE(ro.duration_hours, 0))
FROM rental_option ro
WHERE b.rental_option_id = ro.id
  AND b.status = 'COMPLETED'
  AND b.completed_at IS NULL;

SELECT setval(pg_get_serial_sequence('rental_option', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM rental_option), 1), 1), true);
SELECT setval(pg_get_serial_sequence('scooter', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM scooter), 1), 1), true);
SELECT setval(pg_get_serial_sequence('booking', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM booking), 1), 1), true);
SELECT setval(pg_get_serial_sequence('payment', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM payment), 1), 1), true);
SELECT setval(pg_get_serial_sequence('booking_confirmation', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM booking_confirmation), 1), 1), true);
SELECT setval(pg_get_serial_sequence('feedback', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM feedback), 1), 1), true);
