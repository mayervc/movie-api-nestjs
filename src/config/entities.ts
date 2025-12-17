import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
// import { Cast } from '../cast/entities/cast.entity'; // Temporalmente deshabilitado para evitar problemas de sincronización
import { User } from '../users/entities/user.entity';

/**
 * Array centralizado de todas las entidades de TypeORM
 * Este archivo se usa tanto en app.module.ts como en typeorm.config.ts
 * para evitar duplicación y mantener una única fuente de verdad
 *
 * NOTA: Cast está temporalmente deshabilitado hasta resolver los problemas de sincronización
 */
export const entities = [Movie, Actor, User]; // Cast removido temporalmente
