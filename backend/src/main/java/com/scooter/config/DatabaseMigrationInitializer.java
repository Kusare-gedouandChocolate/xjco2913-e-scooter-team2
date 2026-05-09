package com.scooter.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationInitializer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void applyRepeatableMigrations() {
        addFeedbackForeignKeyIfMissing("fk_feedback_user",
                "ALTER TABLE feedback ADD CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(user_id)");
        addFeedbackForeignKeyIfMissing("fk_feedback_booking",
                "ALTER TABLE feedback ADD CONSTRAINT fk_feedback_booking FOREIGN KEY (booking_id) REFERENCES booking(id)");
        addFeedbackForeignKeyIfMissing("fk_feedback_scooter",
                "ALTER TABLE feedback ADD CONSTRAINT fk_feedback_scooter FOREIGN KEY (scooter_id) REFERENCES scooter(id)");
    }

    private void addFeedbackForeignKeyIfMissing(String constraintName, String sql) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM pg_constraint WHERE conname = ?",
                Integer.class,
                constraintName);
        if (count != null && count == 0) {
            jdbcTemplate.execute(sql);
        }
    }
}
