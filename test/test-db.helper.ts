import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { entities } from '../src/config/entities';

config();

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
   * Crea la base de datos de test si no existe
   */
  async createDatabase(): Promise<void> {
    // Conectar a la base de datos 'postgres' para crear la BD de test
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: this.testDbPort,
      username: process.env.DB_USERNAME || 'stremio',
      password: process.env.DB_PASSWORD || 'stremio_pass',
      database: 'postgres', // Conectar a la BD por defecto
      synchronize: false,
      logging: false
    });

    try {
      await adminDataSource.initialize();

      // Verificar si la base de datos existe
      const result = await adminDataSource.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [this.testDbName]
      );

      if (result.length === 0) {
        // Crear la base de datos
        await adminDataSource.query(`CREATE DATABASE ${this.testDbName}`);
        console.log(`✅ Base de datos '${this.testDbName}' creada`);
      } else {
        console.log(`ℹ️  Base de datos '${this.testDbName}' ya existe`);
      }

      await adminDataSource.destroy();
    } catch (error) {
      console.error('❌ Error creando base de datos:', error.message);
      throw error;
    }
  }

  /**
   * Elimina completamente la base de datos de test
   */
  async dropDatabase(): Promise<void> {
    // Conectar a la base de datos 'postgres' para eliminar la BD de test
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: this.testDbPort,
      username: process.env.DB_USERNAME || 'stremio',
      password: process.env.DB_PASSWORD || 'stremio_pass',
      database: 'postgres',
      synchronize: false,
      logging: false
    });

    try {
      await adminDataSource.initialize();

      // Terminar todas las conexiones activas a la BD de test
      await adminDataSource.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [this.testDbName]
      );

      // Eliminar la base de datos
      await adminDataSource.query(`DROP DATABASE IF EXISTS ${this.testDbName}`);
      console.log(`🗑️  Base de datos '${this.testDbName}' eliminada`);

      await adminDataSource.destroy();
    } catch (error) {
      console.error('❌ Error eliminando base de datos:', error.message);
      // No lanzar error si la BD no existe
      if (!error.message.includes('does not exist')) {
        throw error;
      }
    }
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
   * Setup completo: crea BD, limpia esquema y ejecuta migraciones
   */
  async setup(): Promise<void> {
    await this.createDatabase();
    await this.cleanSchema();
    await this.runMigrations();
  }

  /**
   * Teardown: limpia el esquema (más rápido que eliminar BD)
   * O usa dropDatabase() si prefieres eliminar completamente la BD
   */
  async teardown(dropDatabase: boolean = false): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }

    if (dropDatabase) {
      await this.dropDatabase();
    } else {
      // Solo limpiar el esquema (más rápido)
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
  }

  /**
   * Obtiene el DataSource configurado para la BD de test
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
