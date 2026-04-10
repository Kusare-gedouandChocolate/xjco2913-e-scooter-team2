-- 删除已存在的表（如果有）
DROP TABLE IF EXISTS booking_confirmation CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS rental_option CASCADE;
DROP TABLE IF EXISTS scooter CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
                       user_id UUID PRIMARY KEY,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(50) NOT NULL
);

CREATE TABLE scooter (
                         id BIGSERIAL PRIMARY KEY,
                         model VARCHAR(255),
                         status VARCHAR(50),
                         battery_level INT
);

CREATE TABLE rental_option (
                               id BIGSERIAL PRIMARY KEY,
                               duration_label VARCHAR(50),
                               duration_hours INT,
                               price NUMERIC(10,2)
);

CREATE TABLE booking (
                         id BIGSERIAL PRIMARY KEY,
                         user_id UUID,
                         scooter_id BIGINT,
                         rental_option_id BIGINT,
                         status VARCHAR(50),
                         total_price NUMERIC(10,2),
                         start_time TIMESTAMP,
                         created_at TIMESTAMP
);

CREATE TABLE booking_confirmation (
                                      id BIGSERIAL PRIMARY KEY,
                                      booking_id BIGINT,
                                      confirmation_number VARCHAR(255),
                                      confirmed_at TIMESTAMP
);

INSERT INTO scooter (model, status, battery_level) VALUES
                                                       ('Xiaomi M365', 'AVAILABLE', 85),
                                                       ('Ninebot ES2', 'AVAILABLE', 92),
                                                       ('Segway Ninebot', 'MAINTENANCE', 0),
                                                       ('OKAI ES10', 'AVAILABLE', 78);


INSERT INTO rental_option (duration_label, duration_hours, price) VALUES
                                                                      ('1小时', 1, 500),
                                                                      ('4小时', 4, 1800),
                                                                      ('1天', 24, 6000),
                                                                      ('1周', 168, 35000);

-- =====================================================
-- 补充 users 数据
-- =====================================================
INSERT INTO users (user_id, email, password_hash, role) VALUES
                                                            ('11111111-1111-1111-1111-111111111111', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJZ4JjJ6X6X6X6X6X6X6X6X6X6X6', 'CUSTOMER'),
                                                            ('22222222-2222-2222-2222-222222222222', 'bob@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJZ4JjJ6X6X6X6X6X6X6X6X6X6X', 'CUSTOMER'),
                                                            ('33333333-3333-3333-3333-333333333333', 'charlie@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJZ4JjJ6X6X6X6X6X6X6X6X6X6X', 'ADMIN'),
                                                            ('44444444-4444-4444-4444-444444444444', 'diana@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJZ4JjJ6X6X6X6X6X6X6X6X6X6X', 'CUSTOMER'),
                                                            ('55555555-5555-5555-5555-555555555555', 'eve@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrJZ4JjJ6X6X6X6X6X6X6X6X6X6X', 'CUSTOMER');

-- =====================================================
-- 补充 scooter 数据
-- =====================================================
INSERT INTO scooter (model, status, battery_level) VALUES
                                                       ('Niu KQi3 Pro', 'AVAILABLE', 94),
                                                       ('Xiaomi Mi 3', 'AVAILABLE', 67),
                                                       ('Ninebot MAX G30', 'AVAILABLE', 100),
                                                       ('Okai Neon Pro', 'MAINTENANCE', 23),
                                                       ('Segway F40', 'AVAILABLE', 81),
                                                       ('Xiaomi 4 Pro', 'BOOKED', 55),
                                                       ('Ninebot F25', 'AVAILABLE', 73),
                                                       ('Niu KQi2 Pro', 'UNAVAILABLE', 12);

-- =====================================================
-- 补充 rental_option 数据（若需要更多套餐）
-- =====================================================
INSERT INTO rental_option (duration_label, duration_hours, price) VALUES
                                                                      ('2小时', 2, 900),
                                                                      ('8小时', 8, 3200),
                                                                      ('3天', 72, 15000),
                                                                      ('1个月', 720, 120000);

-- =====================================================
-- 补充 booking 数据
-- =====================================================
INSERT INTO booking (user_id, scooter_id, rental_option_id, status, total_price, start_time, created_at) VALUES
-- Alice 的预订
((SELECT user_id FROM users WHERE email = 'alice@example.com'), 1, 1, 'CONFIRMED', 500, '2025-03-20 10:00:00', '2025-03-19 14:23:00'),
((SELECT user_id FROM users WHERE email = 'alice@example.com'), 2, 2, 'COMPLETED', 1800, '2025-03-15 09:00:00', '2025-03-14 20:15:00'),
-- Bob 的预订
((SELECT user_id FROM users WHERE email = 'bob@example.com'), 3, 3, 'CONFIRMED', 6000, '2025-03-21 08:30:00', '2025-03-20 11:45:00'),
((SELECT user_id FROM users WHERE email = 'bob@example.com'), 4, 1, 'CANCELLED', 500, '2025-03-18 14:00:00', '2025-03-17 09:30:00'),
-- Diana 的预订
((SELECT user_id FROM users WHERE email = 'diana@example.com'), 5, 4, 'CONFIRMED', 35000, '2025-03-25 12:00:00', '2025-03-22 18:20:00'),
((SELECT user_id FROM users WHERE email = 'diana@example.com'), 6, 5, 'PENDING', 900, '2025-03-28 15:00:00', '2025-03-27 10:05:00'),
-- Eve 的预订
((SELECT user_id FROM users WHERE email = 'eve@example.com'), 7, 6, 'CONFIRMED', 3200, '2025-03-22 09:00:00', '2025-03-21 16:40:00'),
((SELECT user_id FROM users WHERE email = 'eve@example.com'), 8, 2, 'COMPLETED', 1800, '2025-03-10 11:00:00', '2025-03-09 22:10:00'),
-- 更多预订
((SELECT user_id FROM users WHERE email = 'alice@example.com'), 2, 7, 'CONFIRMED', 15000, '2025-04-01 10:00:00', '2025-03-28 09:15:00'),
((SELECT user_id FROM users WHERE email = 'bob@example.com'), 3, 8, 'CONFIRMED', 120000, '2025-04-10 00:00:00', '2025-03-25 14:50:00');

-- =====================================================
-- 补充 booking_confirmation 数据（对应已确认的预订）
-- =====================================================
INSERT INTO booking_confirmation (booking_id, confirmation_number, confirmed_at) VALUES
                                                                                     ((SELECT id FROM booking WHERE user_id = (SELECT user_id FROM users WHERE email = 'alice@example.com') AND start_time = '2025-03-20 10:00:00'), 'CONF-1001-ABCD', '2025-03-19 14:25:00'),
                                                                                     ((SELECT id FROM booking WHERE user_id = (SELECT user_id FROM users WHERE email = 'bob@example.com') AND start_time = '2025-03-21 08:30:00'), 'CONF-1002-EFGH', '2025-03-20 11:50:00'),
                                                                                     ((SELECT id FROM booking WHERE user_id = (SELECT user_id FROM users WHERE email = 'diana@example.com') AND start_time = '2025-03-25 12:00:00'), 'CONF-1003-IJKL', '2025-03-22 18:25:00'),
                                                                                     ((SELECT id FROM booking WHERE user_id = (SELECT user_id FROM users WHERE email = 'eve@example.com') AND start_time = '2025-03-22 09:00:00'), 'CONF-1004-MNOP', '2025-03-21 16:45:00'),
                                                                                     ((SELECT id FROM booking WHERE user_id = (SELECT user_id FROM users WHERE email = 'alice@example.com') AND start_time = '2025-04-01 10:00:00'), 'CONF-1005-QRST', '2025-03-28 09:20:00'),
                                                                                     ((SELECT id FROM booking WHERE user_id = (SELECT user_id FROM users WHERE email = 'bob@example.com') AND start_time = '2025-04-10 00:00:00'), 'CONF-1006-UVWX', '2025-03-25 14:55:00');