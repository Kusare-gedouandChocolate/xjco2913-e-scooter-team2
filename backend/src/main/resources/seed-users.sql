-- Baseline accounts shared by the team across fresh local databases.
-- Test password for all seeded accounts: Password123!
-- BCrypt hash generated for Password123!

INSERT INTO users (user_id, email, password_hash, role, full_name, phone)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Alice Chen', '13800000001'),
    ('22222222-2222-2222-2222-222222222222', 'bob@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Bob Li', '13800000002'),
    ('33333333-3333-3333-3333-333333333333', 'charlie@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'manager', 'Charlie Admin', '13800000003'),
    ('44444444-4444-4444-4444-444444444444', 'diana@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Diana Xu', '13800000004'),
    ('55555555-5555-5555-5555-555555555555', 'eve@example.com', '$2b$12$eZG6E7bKg0WgW09o7kEgouG8YgzC6wbajb2tn6k/BeUkCsTUHLE2u', 'customer', 'Eve Zhou', '13800000005')
ON CONFLICT (user_id) DO UPDATE
SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
