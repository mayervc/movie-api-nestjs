import { TestDatabaseHelper } from './test-db.helper';

/**
 * Setup global para todos los tests E2E
 * Se ejecuta una vez antes de todos los tests
 *
 * IMPORTANTE: Este archivo se ejecuta automáticamente gracias a
 * "setupFilesAfterEnv" en jest-e2e.json
 */
let dbHelper: TestDatabaseHelper;

// Configurar variables de entorno ANTES de crear el helper
process.env.DB_DATABASE = 'stremio_db_test';
process.env.DB_TEST_PORT = '5436';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  jest.setTimeout(60000); // Aumentar timeout para setup de BD

  console.log('🚀 Iniciando setup de base de datos de test...');

  dbHelper = new TestDatabaseHelper();

  // Setup completo: crear BD, limpiar esquema y ejecutar migraciones
  await dbHelper.setup();

  console.log('✅ Setup de base de datos completado');
});

/**
 * Teardown global para todos los tests E2E
 * Se ejecuta una vez después de todos los tests
 */
afterAll(async () => {
  if (dbHelper) {
    console.log('🧹 Limpiando base de datos de test...');

    // Opción 1: Limpiar solo el esquema (más rápido, recomendado)
    // Esto elimina todas las tablas pero mantiene la BD
    await dbHelper.teardown(false);

    // Opción 2: Eliminar completamente la BD (descomentar si prefieres)
    // await dbHelper.teardown(true);

    console.log('✅ Limpieza completada');
  }
});
