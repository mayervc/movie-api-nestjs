import { config } from 'dotenv';
import { resolve } from 'path';
import { TestDatabaseHelper } from './test-db.helper';
import { closeTestApp } from './test-app.helper';

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
  jest.setTimeout(60000); // Aumentar timeout para setup de BD

  console.log('🚀 Iniciando setup de base de datos de test...');

  dbHelper = new TestDatabaseHelper();

  // Setup completo: limpiar esquema y ejecutar migraciones
  // Nota: La BD es creada por Docker Compose, no necesitamos crearla aquí
  await dbHelper.setup();

  console.log('✅ Setup de base de datos completado');
});

/**
 * Teardown global para todos los tests E2E
 * Se ejecuta una vez después de todos los tests
 */
afterAll(async () => {
  // Cerrar la aplicación de test
  await closeTestApp();

  if (dbHelper) {
    console.log('🧹 Limpiando base de datos de test...');

    // Limpiar el esquema (la BD es gestionada por Docker Compose)
    await dbHelper.teardown();

    console.log('✅ Limpieza completada');
  }
});
