import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { entities } from './entities';

config();

/**
 * Configuración de TypeORM específica para tests
 * Usa la base de datos de test y ejecuta migraciones
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_TEST_PORT || '5436'),
  username: process.env.DB_USERNAME || 'stremio',
  password: process.env.DB_PASSWORD || 'stremio_pass',
  database: process.env.DB_DATABASE || 'stremio_db_test',
  entities: entities,
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false
});
