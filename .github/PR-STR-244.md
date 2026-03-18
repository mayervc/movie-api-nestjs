## Jira

- STR-244 – Get cinemas list (GET /cinemas). Add your Jira ticket link here if needed.

---
## Summary

**GET /cinemas** – Public endpoint to list cinemas with pagination.

- **Endpoint:** GET `/cinemas`, `@Public()`. Supports `page` and `limit` query params (defaults: `page=1`, `limit=10`).
- **Implementation:** `CinemasService.findAll(page, limit)` returns `{ data, total, page, limit, totalPages }`. `CinemasController` wires the route and exposes Swagger decorators.
- **E2E:** `test/cinemas.e2e-spec.ts` – verifies 200 response with correct pagination structure and empty result when there are no cinemas.

**Files changed:**

- `src/cinemas/*` – Cinemas entity, module, controller and service
- `src/migrations/1700000000009-CreateCinemasTable.ts` – new migration for `cinemas` table
- `src/app.module.ts` + `src/config/entities.ts` – register `CinemasModule` and TypeORM entities
- `test/test-app.helper.ts`, `test/test-setup.ts`, `test/test-db.helper.ts` – test setup includes `cinemas`
- `test/cinemas.e2e-spec.ts` – E2E tests for `GET /cinemas`

**Prerequisite fix (compilation):**
- `src/users/enums/user-role.enum.ts` + `src/migrations/1700000000008-AddVendorClientToUserRole.ts`

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/cinemas.e2e-spec.ts` GET /cinemas | Pass | *(you will add)* |

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

