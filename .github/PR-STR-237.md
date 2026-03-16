## Jira

- STR-237 – [DELETE] /actors/:id - Delete actor. Add your Jira ticket link here if needed.

---

## Summary

**DELETE /actors/:id** – Deletes an actor (ADMIN only). Endpoint already implemented; this PR adds E2E coverage.

- **Endpoint:** DELETE /actors/:id, `@Roles(UserRole.ADMIN)`. Returns 204 No Content.
- **E2E:** `test/actors.e2e-spec.ts` – DELETE /actors/:id: 204 when ADMIN deletes; 403 when non-ADMIN; 401 when not authenticated; 404 when actor not found.

**Files changed:**
- `test/actors.e2e-spec.ts` (DELETE /actors/:id: 4 tests)

---

## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/actors.e2e-spec.ts` DELETE /actors/:id | Pass | *(you will add)* |

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
