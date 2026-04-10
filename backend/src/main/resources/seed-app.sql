INSERT INTO discount_rule (rule_type, discount_rate, enabled, min_completed_bookings)
SELECT 'FREQUENT_USER', 15.00, TRUE, 2
WHERE NOT EXISTS (
    SELECT 1 FROM discount_rule WHERE rule_type = 'FREQUENT_USER'
);

INSERT INTO discount_rule (rule_type, discount_rate, enabled, min_completed_bookings)
SELECT 'STUDENT', 10.00, TRUE, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM discount_rule WHERE rule_type = 'STUDENT'
);

INSERT INTO discount_rule (rule_type, discount_rate, enabled, min_completed_bookings)
SELECT 'SENIOR', 20.00, TRUE, NULL
WHERE NOT EXISTS (
    SELECT 1 FROM discount_rule WHERE rule_type = 'SENIOR'
);
