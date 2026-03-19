## Jira

- STR-247 – Search cinemas (GET /cinemas/search?q=&page=&limit=)

---

## Summary

**GET /cinemas/search** – Public search with pagination.

- **Query:** `q` (optional), `page` (default 1), `limit` (default 10).
- **Behavior:** `q` matches **ILIKE** on `name`, `address`, `city`, `country`, `phoneNumber`, `countryCode`. Empty/whitespace `q` lists all cinemas (same response shape as GET `/cinemas`).
- **Errors:** `400` when `page` or `limit` &lt; 1 or non-numeric (via `ParseIntPipe` / service).

**Files:** `src/cinemas/cinemas.controller.ts`, `src/cinemas/cinemas.service.ts`, `test/cinemas.e2e-spec.ts`

---

## Tests

| Suite | Command |
| ----- | ------- |
| Cinemas E2E | `npm run test:e2e -- --testPathPattern="cinemas\.e2e"` |

---

## Swagger

- [x] `@ApiOperation`, `@ApiQuery`, `@ApiResponse`

---

## Checklist

- [x] Follows `.cursorrules`
- [ ] `npm run lint`
