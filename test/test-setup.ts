import { config } from 'dotenv';
import { resolve } from 'path';
import { TestDatabaseHelper } from './test-db.helper';
import { closeTestApp } from './test-app.helper';
import { waitForTablesToBeReady } from './test-helpers';

/**
 * Cargar variables de entorno desde .env.test
 */
config({ path: resolve(__dirname, '../.env.test') });

/**
 * Setup global para todos los tests E2E
 * Se ejecuta una vez antes de todos los tests
 *
 * IMPORTANTE: Este archivo se ejecuta automáticamente gracias a
 * "setupFilesAfterEnv" en jest-e2e.json
 */
let dbHelper: TestDatabaseHelper;

beforeAll(async () => {
  jest.setTimeout(60000);

  dbHelper = new TestDatabaseHelper();
  await dbHelper.setup();
  await waitForTablesToBeReady(['users', 'movies']);
});

/**
 * Teardown global para todos los tests E2E
 * Se ejecuta una vez después de todos los tests
 */
afterAll(async () => {
  await closeTestApp();

  if (dbHelper) {
    await dbHelper.teardown();
  }
});
