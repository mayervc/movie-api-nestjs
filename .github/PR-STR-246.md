## Jira

- STR-246 – Get cinema by ID (GET /cinemas/:id). Add your Jira ticket link here if needed.

---

## Summary

**GET /cinemas/:id** – Public endpoint to return a single cinema.

- **Endpoint:** GET `/cinemas/:id`, `@Public()`.
- **Implementation:** `CinemasService.findOne(id)` loads by primary key; `NotFoundException` → 404 when missing.
- **E2E:** `test/cinemas.e2e-spec.ts` – 200 with full cinema payload, 404 for unknown id, public access without token.

**Files changed:**

- `src/cinemas/cinemas.controller.ts` – route + Swagger
- `src/cinemas/cinemas.service.ts` – `findOne`
- `test/cinemas.e2e-spec.ts` – GET /cinemas/:id tests

---

## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/cinemas.e2e-spec.ts` GET /cinemas/:id | Pass | *(you will add)* |

---

## Swagger documentation

- [x] Endpoint documented with `@ApiOperation`, `@ApiResponse`
- [ ] Reviewed at http://localhost:5000/api-docs

---

## Checklist

- [x] Code follows project conventions (`.cursorrules`)
- [x] Tests pass (`npm run test:e2e -- --testPathPattern="cinemas.e2e"`)
- [ ] No lint errors (`npm run lint`)

---

## Postman screenshots

<!-- Paste below -->
