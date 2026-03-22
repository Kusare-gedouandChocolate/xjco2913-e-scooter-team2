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