## Jira

- STR-250 – Link users to cinema (POST `/cinemas/:id/users`).

---
## Summary

**POST /cinemas/:id/users** – Protected endpoint to link a user to a cinema (ADMIN only).

- **Endpoint:** `POST /cinemas/:id/users`, protected with `@Roles(UserRole.ADMIN)` (and `@ApiBearerAuth()`).
- **Implementation:** `CinemasService.linkUserToCinema()`:
  - 404 when the cinema doesn’t exist
  - 404 when the user doesn’t exist
  - 400 when the body validation fails
  - 400 when the user is already linked to the cinema (unique constraint)
- **E2E:** `test/cinemas.e2e-spec.ts` – success + auth/role + 400/401/403/404.

**Files changed:**

- `src/cinemas/cinemas.controller.ts` – add POST `/cinemas/:id/users`
- `src/cinemas/cinemas.service.ts` – add `linkUserToCinema()`
- `src/cinemas/dto/link-cinema-user.dto.ts` – DTO for `{ userId }`
- `test/cinemas.e2e-spec.ts` – add POST tests
- `test/cinemas.e2e-spec.ts` – create/truncate `cinema_users` table for these tests

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/cinemas.e2e-spec.ts` POST /cinemas/:id/users | Pass | *(you will add)* |

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

