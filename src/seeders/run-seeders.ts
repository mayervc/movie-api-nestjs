import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedMovies } from './movie.seeder';
import { seedUsers } from './user.seeder';
import { seedCinemas } from './cinema.seeder';
import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
import { Cast } from '../cast/entities/cast.entity';
import { User } from '../users/entities/user.entity';
import { Cinema } from '../cinemas/entities/cinema.entity';

config();

async function runSeeders() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'stremio',
    password: process.env.DB_PASSWORD || 'stremio_pass',
    database: process.env.DB_DATABASE || 'stremio_db_dev',
    entities: [Movie, Actor, Cast, User, Cinema],
    synchronize: false,
    logging: true
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Limpiar datos existentes (opcional)
    const castRepository = dataSource.getRepository(Cast);
    const movieRepository = dataSource.getRepository(Movie);
    const actorRepository = dataSource.getRepository(Actor);
    const userRepository = dataSource.getRepository(User);
    const cinemaRepository = dataSource.getRepository(Cinema);

    console.log('Cleaning existing data...');
    // Limpiar en orden: primero cast (tabla con foreign keys), luego movies, actors y users
    await castRepository.query('TRUNCATE TABLE "cast" CASCADE');
    await movieRepository.query('TRUNCATE TABLE "movies" CASCADE');
    await actorRepository.query('TRUNCATE TABLE "actors" CASCADE');
    await userRepository.query('TRUNCATE TABLE "users" CASCADE');
    await dataSource.query('TRUNCATE TABLE "cinemas" CASCADE');

    // Ejecutar seeders
    console.log('Inserting users...');
    await seedUsers(dataSource);
    await seedMovies(dataSource);
    await seedCinemas(dataSource);

    await dataSource.destroy();
    console.log('Seeders completed successfully');
    console.log('');
    console.log('Test users:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   User:  user@example.com / user123');
    process.exit(0);
  } catch (error) {
    console.error('Error running seeders:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeeders();
