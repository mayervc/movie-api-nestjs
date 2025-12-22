import { DataSource } from 'typeorm';
import typeormTestConfig from '../src/config/typeorm-test.config';

/**
 * Helper para verificar que las migraciones se completaron y las tablas están disponibles
 */
export async function waitForTablesToBeReady(
  requiredTables: string[] = ['users', 'movies'],
  maxRetries: number = 10,
  retryDelay: number = 500
): Promise<void> {
  const dataSource = typeormTestConfig;

  // Asegurar que el DataSource esté inicializado
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  } catch (error) {
    // Si falla la inicialización, esperar un poco y reintentar
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Verificar que el DataSource sigue inicializado
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      const existingTables = await dataSource.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      const tableNames = existingTables.map((row: any) => row.tablename);
      const allTablesExist = requiredTables.every((table) =>
        tableNames.includes(table)
      );

      if (allTablesExist) {
        return; // Todas las tablas existen, podemos continuar
      }

      // Si no todas las tablas existen, esperar y reintentar
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      // Si hay un error de conexión, intentar reconectar
      if (
        error.message.includes('Connection') ||
        error.message.includes('closed')
      ) {
        try {
          if (dataSource.isInitialized) {
            await dataSource.destroy();
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          await dataSource.initialize();
        } catch (reconnectError) {
          // Ignorar errores de reconexión y continuar con el siguiente intento
        }
      }

      // Si no es el último intento, esperar y reintentar
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw new Error(
          `Las tablas no están disponibles después de ${maxRetries} intentos: ${error.message}`
        );
      }
    }
  }

  throw new Error(
    `Las tablas requeridas (${requiredTables.join(', ')}) no están disponibles después de ${maxRetries} intentos`
  );
}
