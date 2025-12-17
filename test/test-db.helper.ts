import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { entities } from '../src/config/entities';

// Cargar variables de entorno desde .env.test
config({ path: resolve(__dirname, '../.env.test') });

/**
 * Helper para gestionar la base de datos de test
 * - Crea la base de datos si no existe
 * - Ejecuta migraciones
 * - Limpia la base de datos después de los tests
 */
export class TestDatabaseHelper {
  private dataSource: DataSource;
  private readonly testDbName: string;
  private readonly testDbPort: number;

  constructor() {
    this.testDbName = process.env.DB_DATABASE || 'stremio_db_test';
    this.testDbPort = parseInt(process.env.DB_TEST_PORT || '5436');

    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: this.testDbPort,
      username: process.env.DB_USERNAME || 'stremio',
      password: process.env.DB_PASSWORD || 'stremio_pass',
      database: this.testDbName,
      entities: entities,
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
      logging: false
    });
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
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }

    // Solo limpiar el esquema (la BD es gestionada por Docker)
    const tempDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: this.testDbPort,
      username: process.env.DB_USERNAME || 'stremio',
      password: process.env.DB_PASSWORD || 'stremio_pass',
      database: this.testDbName,
      synchronize: false,
      logging: false
    });

    try {
      await tempDataSource.initialize();
      await tempDataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
      await tempDataSource.query('CREATE SCHEMA public');
      await tempDataSource.query('GRANT ALL ON SCHEMA public TO stremio');
      await tempDataSource.query('GRANT ALL ON SCHEMA public TO public');
      await tempDataSource.destroy();
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
