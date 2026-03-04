## Jira

- STR-233 – [POST] /movies/:id/cast/delete - Remove multiple actors from cast. Add your Jira ticket link here if needed.

---

## Summary

**POST /movies/:id/cast/delete** – Removes multiple actors from a movie's cast by actorIds (ADMIN only). Endpoint already implemented; this PR adds E2E coverage.

- **Endpoint:** POST /movies/:id/cast/delete, `@Roles(UserRole.ADMIN)`. Body: `actorIds: number[]`. Returns 200 OK.
- **E2E:** `test/movies.e2e-spec.ts` – POST /movies/:id/cast/delete: 200 when ADMIN removes multiple actors; 403 when non-ADMIN; 401 when not authenticated; 404 when movie not found; 400 when actorIds is empty.

**Files changed:**
- `test/movies.e2e-spec.ts` (describe POST /movies/:id/cast/delete with 5 tests)

---

## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/movies.e2e-spec.ts` POST /movies/:id/cast/delete | Pass | *(you will add)* |

---

## Swagger documentation

- [x] Endpoint documented with `@ApiOperation` and `@ApiResponse`
- [ ] Reviewed at http://localhost:5000/api-docs

---

## Checklist

- [x] Code follows project conventions (`.cursorrules`)
- [x] Tests pass (`npm run test:e2e`)
- [x] No lint errors (`npm run lint`)

---

## Postman screenshots

<!-- Paste below -->
