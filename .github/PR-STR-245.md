## Jira

- STR-245 – Create cinema (POST /cinemas). Add your Jira ticket link here if needed.

---
## Summary

**POST /cinemas** – Protected endpoint to create a cinema (ADMIN only).

- **Endpoint:** POST `/cinemas`, protected with `@Roles(UserRole.ADMIN)` (and `@ApiBearerAuth()`).
- **Implementation:** `CinemasService.create()` saves a new `Cinema` using `CreateCinemaDto` validation.
- **E2E:** `test/cinemas.e2e-spec.ts` – verifies 201 (ADMIN), 403 (non-admin), 401 (no auth) and 400 (validation).

**Files changed:**

- `src/cinemas/dto/create-cinema.dto.ts` – DTO for input validation.
- `src/cinemas/cinemas.controller.ts` – add `POST /cinemas`.
- `src/cinemas/cinemas.service.ts` – add cinema creation logic.
- `test/cinemas.e2e-spec.ts` – add POST tests.

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/cinemas.e2e-spec.ts` POST /cinemas | Pass | *(you will add)* |

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

