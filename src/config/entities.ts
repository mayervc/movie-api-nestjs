import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
import { Cast } from '../cast/entities/cast.entity';
import { User } from '../users/entities/user.entity';

/**
 * Array centralizado de todas las entidades de TypeORM
 * Este archivo se usa tanto en app.module.ts como en typeorm.config.ts
 * para evitar duplicación y mantener una única fuente de verdad
 */
export const entities = [Movie, Actor, Cast, User];
