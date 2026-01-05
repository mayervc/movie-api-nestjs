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

      // Verificar si el esquema existe antes de intentar eliminarlo
      const schemaExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM pg_namespace WHERE nspname = 'public'
        );
      `);

      if (schemaExists[0]?.exists) {
        // Eliminar todos los tipos personalizados primero (ENUMs, etc.)
        try {
          const customTypes = await this.dataSource.query(`
            SELECT typname FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
          `);

          for (const type of customTypes) {
            try {
              await this.dataSource.query(
                `DROP TYPE IF EXISTS "public"."${type.typname}" CASCADE`
              );
            } catch (error) {
              // Ignorar errores al eliminar tipos individuales
            }
          }
        } catch (error) {
          // Ignorar errores al consultar tipos
        }

        // Eliminar todas las tablas
        try {
          const tables = await this.dataSource.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
          `);

          for (const table of tables) {
            try {
              await this.dataSource.query(
                `DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE`
              );
            } catch (error) {
              // Ignorar errores al eliminar tablas individuales
            }
          }
        } catch (error) {
          // Ignorar errores al consultar tablas
        }

        // Eliminar el esquema completo y recrearlo
        try {
          await this.dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
        } catch (error) {
          // Si falla, puede ser porque hay conexiones activas, pero continuamos
        }
      }

      // Esperar un momento para que PostgreSQL complete el DROP
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reconectar si es necesario
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      // Crear el esquema público nuevamente solo si no existe
      const schemaStillExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM pg_namespace WHERE nspname = 'public'
        );
      `);

      if (!schemaStillExists[0]?.exists) {
        try {
          await this.dataSource.query('CREATE SCHEMA public');
          await this.dataSource.query('GRANT ALL ON SCHEMA public TO stremio');
          await this.dataSource.query('GRANT ALL ON SCHEMA public TO public');
        } catch (error) {
          // Si el esquema ya existe (race condition), no es un problema
          if (
            !error.message.includes('already exists') &&
            !error.message.includes('duplicate key')
          ) {
            throw error;
          }
        }
      } else {
        // Si el esquema ya existe, eliminar cualquier tipo ENUM residual antes de continuar
        try {
          const remainingEnums = await this.dataSource.query(`
            SELECT typname FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
          `);

          for (const enumType of remainingEnums) {
            try {
              await this.dataSource.query(
                `DROP TYPE IF EXISTS "public"."${enumType.typname}" CASCADE`
              );
            } catch (error) {
              // Ignorar errores al eliminar tipos individuales
            }
          }
        } catch (error) {
          // Ignorar errores al consultar tipos
        }

        // Asegurar los permisos
        try {
          await this.dataSource.query('GRANT ALL ON SCHEMA public TO stremio');
          await this.dataSource.query('GRANT ALL ON SCHEMA public TO public');
        } catch (error) {
          // Ignorar errores de permisos si ya están configurados
        }
      }
    } catch (error) {
      // Si el esquema ya existe después de intentar crearlo, es un problema menor
      if (error.message.includes('already exists')) {
        return;
      }

      // Si la conexión se perdió, intentar reconectar
      if (
        error.message.includes('Connection terminated') ||
        error.message.includes('Connection closed')
      ) {
        try {
          if (this.dataSource.isInitialized) {
            await this.dataSource.destroy();
          }
          await this.dataSource.initialize();

          // Intentar crear el esquema nuevamente
          await this.dataSource.query('CREATE SCHEMA IF NOT EXISTS public');
          await this.dataSource.query('GRANT ALL ON SCHEMA public TO stremio');
          await this.dataSource.query('GRANT ALL ON SCHEMA public TO public');

          return;
        } catch (reconnectError) {
          throw reconnectError;
        }
      }
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

      // Eliminar cualquier tipo ENUM residual antes de ejecutar migraciones
      // Esto previene errores de "duplicate key" cuando TypeORM intenta crear tipos que ya existen
      try {
        const existingEnums = await this.dataSource.query(`
          SELECT typname FROM pg_type 
          WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
          AND typtype = 'e'
        `);

        for (const enumType of existingEnums) {
          try {
            await this.dataSource.query(
              `DROP TYPE IF EXISTS "public"."${enumType.typname}" CASCADE`
            );
          } catch (error) {
            // Ignorar errores al eliminar tipos individuales
          }
        }

        // Esperar un momento para que PostgreSQL complete la eliminación
        if (existingEnums.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (error) {
        // Ignorar errores al consultar tipos, continuar con las migraciones
      }

      await this.dataSource.runMigrations();
    } catch (error) {
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

      await this.dataSource.undoLastMigration();
    } catch (error) {
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
    } catch (error) {
      // No lanzar error, solo ignorar
    }
  }

  /**
   * Obtiene el DataSource configurado para la BD de test
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
