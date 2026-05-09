# Database Migration Notes

Database initialization is split into two idempotent scripts:

- `schema-app.sql`: schema, constraints, indexes, compatible column
  backfills
- `seed-app.sql`: baseline discount rule seed data

## Execution Model

- Spring Boot runs both scripts at startup through `spring.sql.init.*`
- Scripts are safe to re-run and do not drop existing application data
- Existing feedback rows are backfilled to `priority=LOW` and
  `status=SUBMITTED`
- Legacy `init.sql` and `data.sql` are retained only as historical
  references and are no longer used by application startup

## Rollback

- Use `rollback-feedback-discount.sql` only when you intentionally
  want to remove feedback/discount support
- The rollback script is destructive for feedback and discount data
- For normal development and CI, do not run rollback; the forward
  scripts are repeatable
