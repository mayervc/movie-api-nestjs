## Jira

- STR-249 – Update cinema (PATCH `/cinemas/:id`). Add your Jira ticket link here if needed.

---
## Summary

**PATCH /cinemas/:id** – Update cinema by id.

- **Endpoint:** PATCH `/cinemas/:id`, protected with `@Roles(UserRole.ADMIN)`.
- **Implementation:** `CinemasService.update(id, dto)`:
  - 404 when cinema doesn’t exist
  - 400 when request body is empty or validation fails
  - 400 when cinema name violates uniqueness
- **E2E:** `test/cinemas.e2e-spec.ts` – success + 401/403/404/400.

**Files changed:**

- `src/cinemas/cinemas.controller.ts` – add PATCH route
- `src/cinemas/cinemas.service.ts` – add `findOne()` + `update()`
- `src/cinemas/dto/update-cinema.dto.ts` – DTO for validation
- `test/cinemas.e2e-spec.ts` – PATCH tests

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/cinemas.e2e-spec.ts` PATCH /cinemas/:id | Pass | *(you will add)* |

---
## Swagger documentation

- [x] Endpoint documented with `@ApiOperation`, `@ApiResponse`
- [ ] Reviewed at http://localhost:5000/api-docs

---
## Checklist

- [ ] Code follows project conventions (`.cursorrules`)
- [ ] Tests pass (`npm run test:e2e -- --testPathPattern="cinemas.e2e"`)
- [ ] No lint errors (`npm run lint`)

---
## Postman screenshots

<!-- Paste below -->

