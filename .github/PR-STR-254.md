## Jira

- STR-254 – GET /rooms/:id (Room details) Add your Jira ticket link here if needed.

---
## Summary

**GET /rooms/:id** – Returns a room by ID. Public endpoint, no auth.

- **Endpoint:** GET /rooms/:id, `@Public()`. Returns 200 with room data, 404 when room does not exist.
- **Implementation:** `RoomsService.findOne()` fetches from `rooms` table and throws `NotFoundException` when missing. `RoomsController` exposes the route and includes Swagger decorators.
- **E2E:** `test/rooms.e2e-spec.ts` – GET /rooms/:id: 200 (room exists) and 404 (room missing).

**Files changed:**

- `src/rooms/entities/room.entity.ts` – new `Room` entity.
- `src/rooms/rooms.module.ts` – new module.
- `src/rooms/rooms.controller.ts` – new controller with `GET /rooms/:id`.
- `src/rooms/rooms.service.ts` – new service method.
- `src/migrations/1700000000007-CreateRoomsTable.ts` – new migration creating `rooms` table.
- `test/rooms.e2e-spec.ts` – new E2E suite for the endpoint.
- `src/users/enums/user-role.enum.ts` + `src/migrations/1700000000008-AddVendorClientToUserRole.ts` – prerequisites to fix `UserRole.VENDOR/CLIENT` compilation (referenced by existing controllers/tests).

---
## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/rooms.e2e-spec.ts` GET /rooms/:id | *(fill after running)* | *(you will add)* |

---
## Swagger documentation

- [x] Endpoint documented with `@ApiOperation` and `@ApiResponse`
- [ ] Reviewed at http://localhost:5000/api-docs

---
## Checklist

- [x] Code follows project conventions (`.cursorrules`)
- [ ] Tests pass (`npm run test:e2e -- --testPathPattern=rooms.e2e`)
- [ ] No lint errors (`npm run lint`)

---
## Postman screenshots

<!-- Paste below -->

