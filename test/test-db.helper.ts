import { DataSource } from 'typeorm';
import typeormTestConfig from '../src/config/typeorm-test.config';

/**
 * Helper para gestionar la base de datos de test
 * - Ejecuta migraciones
 * - Limpia la base de datos después de los tests
 * Nota: La base de datos es creada por Docker Compose
 */
export class TestDatabaseHelper {
  private readonly dataSource: DataSource;
  private readonly testDbName: string;
  private readonly testDbPort: number;

  constructor() {
    // Usar el DataSource configurado en typeorm-test.config.ts
    this.dataSource = typeormTestConfig;
    this.testDbName = process.env.DB_DATABASE || 'stremio_db_test';
    this.testDbPort = parseInt(process.env.DB_TEST_PORT || '5436');
  }

  /**
   * Limpia el esquema de la base de datos (drop schema)
   * Alternativa más rápida que eliminar toda la BD
   */
  async cleanSchema(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      // Eliminar todo el esquema público
      await this.dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
      await this.dataSource.query('CREATE SCHEMA public');
      await this.dataSource.query('GRANT ALL ON SCHEMA public TO stremio');
      await this.dataSource.query('GRANT ALL ON SCHEMA public TO public');

      console.log(`🧹 Esquema de '${this.testDbName}' limpiado`);
    } catch (error) {
      console.error('❌ Error limpiando esquema:', error.message);
      throw error;
    }
  }

  /**
   * Ejecuta todas las migraciones pendientes
   */
  async runMigrations(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      console.log('🔄 Ejecutando migraciones...');
      await this.dataSource.runMigrations();
      console.log('✅ Migraciones ejecutadas correctamente');
    } catch (error) {
      console.error('❌ Error ejecutando migraciones:', error.message);
      throw error;
    }
  }

  /**
   * Revierte todas las migraciones
   */
  async revertMigrations(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      console.log('⏪ Revirtiendo migraciones...');
      const migrations = await this.dataSource.undoLastMigration();
      console.log('✅ Migraciones revertidas');
    } catch (error) {
      console.error('❌ Error revirtiendo migraciones:', error.message);
      // No lanzar error si no hay migraciones para revertir
      if (!error.message.includes('cannot be reverted')) {
        throw error;
      }
    }
  }

  /**
   * Setup completo: limpia esquema y ejecuta migraciones
   * Nota: La base de datos es creada por Docker Compose, no necesitamos crearla aquí
   */
  async setup(): Promise<void> {
    await this.cleanSchema();
    await this.runMigrations();
  }

  /**
   * Teardown: limpia el esquema
   * Nota: La base de datos es gestionada por Docker Compose, no la eliminamos
   */
  async teardown(): Promise<void> {
    // Usar el mismo DataSource configurado
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      await this.dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
      await this.dataSource.query('CREATE SCHEMA public');
      await this.dataSource.query('GRANT ALL ON SCHEMA public TO stremio');
      await this.dataSource.query('GRANT ALL ON SCHEMA public TO public');

      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }

      console.log(`🧹 Base de datos '${this.testDbName}' limpiada`);
    } catch (error) {
      console.error('❌ Error en teardown:', error.message);
      // No lanzar error, solo loggear
    }
  }

  /**
   * Obtiene el DataSource configurado para la BD de test
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
