# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Hot-reload dev server (port 5001)
npm run build           # Compile TypeScript

# Testing
npm run test            # Unit tests (*.spec.ts)
npm run test:e2e        # E2E tests (test/*.e2e-spec.ts)
npm run test:cov        # Coverage report

# Run a single unit test file
npx jest src/movies/movies.service.spec.ts

# Run a single E2E test file
npx jest --config test/jest-e2e.json test/movies.e2e-spec.ts

# Code quality
npm run lint            # ESLint with auto-fix
npm run format          # Prettier

# Database
npm run migration:generate  # Generate migration from entity changes
npm run migration:run       # Apply pending migrations
npm run migration:revert    # Revert last migration
npm run seed                # Run seeders
```

## Architecture

**Stack:** NestJS 10 + TypeScript + TypeORM + PostgreSQL

**Feature modules** live under `src/` — each has `controller`, `service`, `module`, `entities/`, and `dto/` subfolders. Current modules: `movies`, `users`, `auth`, `cinemas`, `actors`.

**Global guards** registered in `AppModule`:
- `JwtAuthGuard` — enforces JWT on all routes by default
- `RolesGuard` — enforces `@Roles()` decorator

Use `@Public()` to bypass JWT on a route. Use `@Roles(UserRole.ADMIN)` for role-restricted routes. `@CurrentUser()` injects the authenticated user into a parameter.

**User roles:** `USER` (default), `ADMIN`, `VENDOR`, `CLIENT`

**Database:** Two PostgreSQL instances via Docker Compose — dev on port 5434 (`stremio_db_dev`), test on port 5436 (`stremio_db_test`). Migrations only — never use `synchronize: true`. Entity registration is centralized in `src/config/entities.ts`.

**Swagger** docs auto-generated at `/api-docs`. Annotate all endpoints with `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`.

## Testing Patterns

E2E tests live in `test/*.e2e-spec.ts`. A shared singleton app is created via `createTestApp()` from `test/test-app.helper.ts`. The global setup (`test/test-setup.ts`) runs migrations once before all tests.

Key helpers:
- `createTestApp()` — creates/reuses the NestJS test app (use in `beforeAll`)
- `truncateTables(dataSource, ['table1', 'table2'])` — clean data between tests (use in `beforeEach`)
- `createAdminAndUser()` — creates users and returns JWT tokens for auth testing
- Do NOT call `waitForTablesToBeReady()` inside individual test files (it runs in global setup)

`describe()` blocks must use the route/endpoint name only — no ticket IDs (e.g., `describe('GET /movies', ...)`).

## Conventions

- **DTOs:** `Create*Dto`, `Update*Dto` (use `PartialType(CreateDto)`), `*ResponseDto`
- **Validation:** always use `class-validator` decorators on DTOs
- **Error handling:** throw `NotFoundException`, `ConflictException`, etc. — no generic errors
- **Passwords:** hash with bcrypt before saving; never expose in responses
- **No `any` types**; no emojis in code comments or logs
- **No magic numbers or unexplained string literals** in application code or tests. Use named constants with descriptive names (for example `MILLISECONDS_PER_DAY` instead of `86400000`, or `24 * 60 * 60 * 1000` grouped under one such constant)
- **Commits:** Conventional Commits with scope — `feat(movies):`, `test(cinemas):`, `feat(database):`, `docs(auth):`

## Git Workflow

Use separate branches per work area: `feature/[name]-backend`, `feature/[name]-database`, `feature/[name]-testing`. Merge order: Backend → Database → Testing → Documentation. Ticket IDs go in PR title/body, not in filenames.
