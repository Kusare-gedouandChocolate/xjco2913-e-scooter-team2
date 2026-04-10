package com.scooter.modules.feedback.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class FeedbackSchemaInitializer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureFeedbackColumns() {
        jdbcTemplate.execute("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS priority VARCHAR(20)");
        jdbcTemplate.execute("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS status VARCHAR(20)");
        jdbcTemplate.execute("UPDATE feedback SET priority = 'LOW' WHERE priority IS NULL");
        jdbcTemplate.execute("UPDATE feedback SET status = 'SUBMITTED' WHERE status IS NULL");
        jdbcTemplate.execute("ALTER TABLE feedback ALTER COLUMN priority SET DEFAULT 'LOW'");
        jdbcTemplate.execute("ALTER TABLE feedback ALTER COLUMN status SET DEFAULT 'SUBMITTED'");
    }
}
