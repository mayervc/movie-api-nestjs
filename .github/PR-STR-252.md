## Jira

- STR-252 – Delete cinema (DELETE `/cinemas/:id`).

---
## Summary

**DELETE /cinemas/:id** – Protected endpoint to delete a cinema.

- **Endpoint:** `DELETE /cinemas/:id`, requires authentication.
- **Authorization:**
  - `204` when called by `ADMIN` or by an “owner” user linked in `cinema_users`.
  - `403` when called by an authenticated non-owner non-ADMIN.
- **Implementation:** `CinemasService.deleteCinema(cinemaId, currentUser)`.
  - `404` when cinema doesn’t exist
  - `403` when current user isn’t allowed
- **E2E:** `test/cinemas.e2e-spec.ts` – 204/401/403/404.
- **Swagger documentation:** added on controller method.

**Files changed:**

- `src/cinemas/cinemas.controller.ts` – add DELETE route
- `src/cinemas/cinemas.service.ts` – add `deleteCinema()`
- `src/cinemas/entities/cinema-user.entity.ts` – owner/links table entity
- `src/migrations/1700000000011-CreateCinemaUsersTable.ts` – create `cinema_users`
- `test/cinemas.e2e-spec.ts` – DELETE tests
- `test/test-db.helper.ts` / `test/test-setup.ts` – include `cinema_users`
- `src/cinemas/cinemas.service.spec.ts` – unit tests for `deleteCinema`

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/cinemas.e2e-spec.ts` DELETE /cinemas/:id | Pass | *(you will add)* |
| `src/cinemas/cinemas.service.spec.ts` deleteCinema | Pass | *(you will add)* |

---
## Swagger documentation

- [x] Endpoint documented with `@ApiOperation`, `@ApiResponse`
- [ ] Reviewed at http://localhost:5000/api-docs

---
## Checklist

- [x] Code follows project conventions (`.cursorrules`)
- [x] Tests pass (`npm run test:e2e -- --testPathPattern=\"cinemas.e2e\"`)
- [ ] No lint errors (`npm run lint`)

---
## Postman screenshots

<!-- Paste below -->

