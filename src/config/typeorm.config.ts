import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
import { Cast } from '../cast/entities/cast.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434'),
  username: process.env.DB_USERNAME || 'stremio',
  password: process.env.DB_PASSWORD || 'stremio_pass',
  database: process.env.DB_DATABASE || 'movie_db_dev',
  entities: [Movie, Actor, Cast],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true
});
