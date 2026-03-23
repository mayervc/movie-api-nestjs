Create an E2E test file for a NestJS controller following this project's patterns.

## Target

Given `$ARGUMENTS` (e.g. `cinemas` or `GET /cinemas`), create `test/$module.e2e-spec.ts`.

## Required structure

```typescript
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { createTestApp, testModule } from './test-app.helper';
import { dataSource } from './test-db.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';
import { $Entity } from '../src/$module/entities/$entity.entity';

describe('$ModuleController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<$Entity>;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    repository = testModule.get<Repository<$Entity>>(getRepositoryToken($Entity));
    ({ adminToken, userToken } = await createAdminAndUser(app));
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['$table_name']);
  });

  // Group tests by endpoint, not by ticket ID
  describe('GET /$module', () => { ... });
  describe('GET /$module/:id', () => { ... });
  describe('POST /$module', () => { ... });
  describe('PATCH /$module/:id', () => { ... });
  describe('DELETE /$module/:id', () => { ... });
});
```

## Rules to follow

- `describe()` blocks use route/method only — **no ticket IDs** (e.g. `describe('GET /movies', ...)` not `describe('STR-221 GET /movies', ...)`)
- Do NOT call `waitForTablesToBeReady()` — it runs in global setup (`test/test-setup.ts`)
- Use `beforeEach` with `truncateTables` to isolate each test — pass tables in FK-safe order (children before parents)
- Always test: happy path, not found (404), unauthorized (401), forbidden (403 for non-admin on protected routes), validation errors (400)
- Insert test data directly via repository, not via HTTP POST
- Assert response body shape, not just status codes
- Use `adminToken` for protected routes, `userToken` to test 403s, no token for 401s
- After DELETE, verify with a GET that the resource is gone
