import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedMovies } from './movie.seeder';
import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
import { Cast } from '../cast/entities/cast.entity';

config();

async function runSeeders() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'stremio',
    password: process.env.DB_PASSWORD || 'stremio_pass',
    database: process.env.DB_DATABASE || 'stremio_db_dev',
    entities: [Movie, Actor, Cast],
    synchronize: false,
    logging: true
  });

  try {
    await dataSource.initialize();
    console.log('📦 Conectado a la base de datos');

    // Limpiar datos existentes (opcional)
    const castRepository = dataSource.getRepository(Cast);
    const movieRepository = dataSource.getRepository(Movie);
    const actorRepository = dataSource.getRepository(Actor);

    console.log('🧹 Limpiando datos existentes...');
    // Limpiar en orden: primero cast (tabla con foreign keys), luego movies y actors
    await castRepository.query('TRUNCATE TABLE "cast" CASCADE');
    await movieRepository.query('TRUNCATE TABLE "movies" CASCADE');
    await actorRepository.query('TRUNCATE TABLE "actors" CASCADE');

    // Ejecutar seeders
    await seedMovies(dataSource);

    await dataSource.destroy();
    console.log('✅ Seeders completados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeeders();
