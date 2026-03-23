## Jira

- STR-250 (DB) – Create `cinema_users` join table for cinema <-> user ownership.

---
## Summary

This PR contains the database-side changes needed for `POST /cinemas/:id/users` (STR-250).

**Included:**
- Migration to create `cinema_users`
- `CinemaUser` entity + TypeORM entity registration
- E2E test infra: include `cinema_users` in setup/truncation

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `npm run test:e2e -- --testPathPattern=\"cinemas.e2e\"` | Pass | *(you will add)* |

---
## Swagger documentation

- [ ] Reviewed at http://localhost:5000/api-docs

---
## Checklist

- [ ] Code follows project conventions (`.cursorrules`)
- [ ] Tests pass
- [ ] No lint errors (`npm run lint`)

---
## Postman screenshots

<!-- Paste below -->

