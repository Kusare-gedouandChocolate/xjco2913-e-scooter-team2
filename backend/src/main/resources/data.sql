
-- DELETE FROM booking_confirmation;
-- DELETE FROM booking;
-- DELETE FROM rental_option;
-- DELETE FROM scooter;
-- DELETE FROM users;

-- INSERT INTO users (user_id, email, password_hash, role) VALUES
-- ('123e4567-e89b-12d3-a456-426614174000', 'user@example.com', '$2a$10$Nk2hM/g2V5e2pQp8zGxE1OcHZ4aVl5m8JX5gPq3QwR6tY9uI0oK2', 'customer');

-- 插入滑板车
INSERT INTO scooter (model, status, battery_level) VALUES
                                                       ('Xiaomi M365', 'AVAILABLE', 85),
                                                       ('Ninebot ES2', 'AVAILABLE', 92),
                                                       ('Segway Ninebot', 'MAINTENANCE', 0),
                                                       ('OKAI ES10', 'AVAILABLE', 78);

-- 插入租赁选项
INSERT INTO rental_option (duration_label, duration_hours, price) VALUES
                                                                      ('1hour', 1, 500),
                                                                      ('4hour', 4, 1800),
                                                                      ('1day', 24, 6000),
                                                                      ('1week', 168, 35000);