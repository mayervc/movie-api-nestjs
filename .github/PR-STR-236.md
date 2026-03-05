## Jira

- STR-236 – [PATCH] /actors/:id - Update actor. Add your Jira ticket link here if needed.

---

## Summary

**PATCH /actors/:id** – Updates an actor (ADMIN only). Endpoint already implemented; this PR adds E2E coverage.

- **Endpoint:** PATCH /actors/:id, `@Roles(UserRole.ADMIN)`. Body: UpdateActorDto (partial). Returns 200 with updated actor.
- **E2E:** `test/actors.e2e-spec.ts` – PATCH /actors/:id: 200 when ADMIN updates; 403 when non-ADMIN; 401 when not authenticated; 404 when actor not found; 400 when validation fails (e.g. popularity &lt; 0).

**Files changed:**
- `test/actors.e2e-spec.ts` (PATCH /actors/:id: 5 tests)

---

## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/actors.e2e-spec.ts` PATCH /actors/:id | Pass | *(you will add)* |

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
