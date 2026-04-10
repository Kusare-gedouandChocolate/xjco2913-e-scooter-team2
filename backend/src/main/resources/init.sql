-- =====================================================
-- XJCO2913 E-Scooter 项目数据库初始化脚本（PostgreSQL）
-- 文件名：init.sql
-- 目标：
-- 1) 创建与当前后端实体兼容的核心表结构
-- 2) 提供可联调的模拟数据（核心四表 users/scooter/booking/payment 共 20 条）
-- 3) 保证外键关联正确，避免“脏数据”
-- =====================================================

BEGIN;

-- =====================================================
-- 0. 清理旧表（按依赖顺序逆序删除）
-- =====================================================
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS booking_confirmation CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS rental_option CASCADE;
DROP TABLE IF EXISTS scooter CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. 用户表（对应后端实体：modules.auth.entity.User）
-- =====================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('customer', 'manager')),
    full_name VARCHAR(100),
    phone VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. 车辆表（对应后端实体：modules.scooter.entity.Scooter）
-- 注意：status 必须和 Java 枚举保持一致（大写）
-- =====================================================
CREATE TABLE scooter (
    id BIGSERIAL PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'LOCKED')),
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    current_location VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. 租赁套餐表（对应后端实体：modules.scooter.entity.RentalOption）
-- =====================================================
CREATE TABLE rental_option (
    id BIGSERIAL PRIMARY KEY,
    duration_label VARCHAR(50) NOT NULL,
    duration_hours INT NOT NULL CHECK (duration_hours > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- =====================================================
-- 4. 订单表（对应后端实体：modules.booking.entity.Booking）
-- 注意：status 必须和 Java 枚举保持一致（大写）
-- =====================================================
CREATE TABLE booking (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    user_uuid UUID GENERATED ALWAYS AS (user_id::uuid) STORED,
    scooter_id BIGINT NOT NULL,
    rental_option_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'COMPLETED')),
    total_price NUMERIC(10, 2),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_uuid) REFERENCES users(user_id),
    CONSTRAINT fk_booking_scooter FOREIGN KEY (scooter_id) REFERENCES scooter(id),
    CONSTRAINT fk_booking_rental_option FOREIGN KEY (rental_option_id) REFERENCES rental_option(id)
);

-- =====================================================
-- 5. 支付记录表（项目要求：支付记录）
-- 说明：当前后端暂无 Payment 实体，但该表可用于后续扩展与报表。
-- =====================================================
CREATE TABLE payment (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    -- 支付表同理：应用层用字符串，数据库层仍强校验用户存在
    user_uuid UUID GENERATED ALWAYS AS (user_id::uuid) STORED,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(32) NOT NULL CHECK (payment_status IN ('SUCCESS', 'FAILED', 'REFUNDED')),
    transaction_no VARCHAR(100) NOT NULL UNIQUE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES booking(id),
    CONSTRAINT fk_payment_user FOREIGN KEY (user_uuid) REFERENCES users(user_id)
);

-- =====================================================
-- 6. 预订确认表（对应后端实体：modules.confirmation.entity.BookingConfirmation）
-- 说明：后端支付成功后会写入该表，所以必须存在。
-- =====================================================
CREATE TABLE booking_confirmation (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    confirmation_number VARCHAR(100) NOT NULL UNIQUE,
    confirmed_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_confirmation_booking FOREIGN KEY (booking_id) REFERENCES booking(id)
);

-- =====================================================
-- 7. 索引（提高后端常用查询性能）
-- =====================================================
CREATE INDEX idx_booking_user_id ON booking(user_id);
CREATE INDEX idx_booking_created_at ON booking(created_at);
CREATE INDEX idx_scooter_status ON scooter(status);
CREATE INDEX idx_payment_paid_at ON payment(paid_at);

-- =====================================================
-- 8. 模拟数据
-- 核心四表（users/scooter/booking/payment）共 20 条：
-- users 5 + scooter 5 + booking 6 + payment 4 = 20
-- 另外补充 rental_option 4 条、booking_confirmation 4 条用于联调完整性。
-- =====================================================

-- 测试密码统一为：Password123!
-- BCrypt 哈希（可直接用于 Spring Security BCryptPasswordEncoder）：
-- $2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u

INSERT INTO users (user_id, email, password_hash, role, full_name, phone, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'alice@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Alice Chen', '13800000001', '2026-03-01 09:00:00'),
('22222222-2222-2222-2222-222222222222', 'bob@example.com',   '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Bob Li',     '13800000002', '2026-03-01 09:05:00'),
('33333333-3333-3333-3333-333333333333', 'carol@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Carol Wang',  '13800000003', '2026-03-01 09:10:00'),
('44444444-4444-4444-4444-444444444444', 'david@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'David Xu',    '13800000004', '2026-03-01 09:15:00'),
('55555555-5555-5555-5555-555555555555', 'manager@example.com','$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'manager',  'Team Manager','13800000005', '2026-03-01 09:20:00');

INSERT INTO scooter (id, model, status, battery_level, current_location, created_at) VALUES
(1, 'Xiaomi M365',      'IN_USE',      78, 'Campus Gate A', '2026-03-01 10:00:00'),
(2, 'Ninebot MAX G30',  'AVAILABLE',   92, 'Library North', '2026-03-01 10:05:00'),
(3, 'Niu KQi3 Pro',     'LOCKED',      64, 'Dormitory B',   '2026-03-01 10:10:00'),
(4, 'Segway F40',       'MAINTENANCE', 20, 'Service Center','2026-03-01 10:15:00'),
(5, 'Okai Neon Pro',    'IN_USE',      55, 'Sports Hall',   '2026-03-01 10:20:00');

INSERT INTO rental_option (id, duration_label, duration_hours, price) VALUES
(1, '1h',   1,   500.00),
(2, '4h',   4,  1800.00),
(3, '1day', 24, 6000.00),
(4, '1week',168,35000.00);

INSERT INTO booking (id, user_id, scooter_id, rental_option_id, status, total_price, start_time, end_time, created_at) VALUES
(1, '11111111-1111-1111-1111-111111111111', 1, 2, 'PAID',            1800.00, '2026-03-20 10:00:00', '2026-03-20 14:00:00', '2026-03-20 09:50:00'),
(2, '22222222-2222-2222-2222-222222222222', 2, 1, 'COMPLETED',        500.00, '2026-03-18 08:00:00', '2026-03-18 09:00:00', '2026-03-18 07:50:00'),
(3, '33333333-3333-3333-3333-333333333333', 3, 4, 'PENDING_PAYMENT', 35000.00, '2026-03-25 12:00:00', '2026-04-01 12:00:00', '2026-03-25 11:45:00'),
(4, '44444444-4444-4444-4444-444444444444', 4, 3, 'CANCELLED',       6000.00, '2026-03-17 15:00:00', '2026-03-18 15:00:00', '2026-03-17 14:40:00'),
(5, '11111111-1111-1111-1111-111111111111', 5, 2, 'PAID',            1800.00, '2026-03-28 18:30:00', '2026-03-28 22:30:00', '2026-03-28 18:15:00'),
(6, '22222222-2222-2222-2222-222222222222', 2, 1, 'COMPLETED',        500.00, '2026-03-29 09:00:00', '2026-03-29 10:00:00', '2026-03-29 08:45:00');

INSERT INTO payment (id, booking_id, user_id, amount, payment_method, payment_status, transaction_no, paid_at, created_at) VALUES
(1, 1, '11111111-1111-1111-1111-111111111111', 1800.00, 'CARD',   'SUCCESS', 'TXN-20260320-0001', '2026-03-20 09:55:00', '2026-03-20 09:55:00'),
(2, 2, '22222222-2222-2222-2222-222222222222',  500.00, 'WALLET', 'SUCCESS', 'TXN-20260318-0002', '2026-03-18 07:55:00', '2026-03-18 07:55:00'),
(3, 5, '11111111-1111-1111-1111-111111111111', 1800.00, 'CARD',   'SUCCESS', 'TXN-20260328-0003', '2026-03-28 18:20:00', '2026-03-28 18:20:00'),
(4, 6, '22222222-2222-2222-2222-222222222222',  500.00, 'WALLET', 'SUCCESS', 'TXN-20260329-0004', '2026-03-29 08:50:00', '2026-03-29 08:50:00');

INSERT INTO booking_confirmation (id, booking_id, confirmation_number, confirmed_at) VALUES
(1, 1, 'CONF-20260320-1001', '2026-03-20 09:56:00'),
(2, 2, 'CONF-20260318-1002', '2026-03-18 07:56:00'),
(3, 5, 'CONF-20260328-1003', '2026-03-28 18:21:00'),
(4, 6, 'CONF-20260329-1004', '2026-03-29 08:51:00');

-- 保证序列与手动插入 ID 对齐，避免后续插入出现主键冲突
SELECT setval('scooter_id_seq', (SELECT MAX(id) FROM scooter));
SELECT setval('rental_option_id_seq', (SELECT MAX(id) FROM rental_option));
SELECT setval('booking_id_seq', (SELECT MAX(id) FROM booking));
SELECT setval('payment_id_seq', (SELECT MAX(id) FROM payment));
SELECT setval('booking_confirmation_id_seq', (SELECT MAX(id) FROM booking_confirmation));

COMMIT;
