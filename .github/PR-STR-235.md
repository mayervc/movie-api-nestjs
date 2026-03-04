## Jira

- STR-235 – [POST] /actors - Create actor. Add your Jira ticket link here if needed.

---

## Summary

**POST /actors** – Creates a new actor (ADMIN only). Endpoint already implemented; this PR adds E2E coverage.

- **Endpoint:** POST /actors, `@Roles(UserRole.ADMIN)`. Body: CreateActorDto. Returns 201 with created actor.
- **E2E:** `test/actors.e2e-spec.ts` – POST /actors: 201 when ADMIN creates; 403 when non-ADMIN; 401 when not authenticated; 400 when validation fails (e.g. popularity &lt; 0).

**Files changed:**
- `test/actors.e2e-spec.ts` (POST /actors: 4 tests, use createAdminAndUser + dataSource)

---

## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/actors.e2e-spec.ts` POST /actors | Pass | *(you will add)* |

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
