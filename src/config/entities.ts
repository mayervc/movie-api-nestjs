import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
import { Cast } from '../cast/entities/cast.entity';
import { User } from '../users/entities/user.entity';
import { Cinema } from '../cinemas/entities/cinema.entity';
import { CinemaUser } from '../cinemas/entities/cinema-user.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomBlock } from '../rooms/entities/room-block.entity';
import { RoomSeat } from '../rooms/entities/room-seat.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';

/**
 * Array centralizado de todas las entidades de TypeORM
 * Este archivo se usa tanto en app.module.ts como en typeorm.config.ts
 * para evitar duplicación y mantener una única fuente de verdad
 */
export const entities = [
  Movie,
  Actor,
  Cast,
  User,
  Cinema,
  CinemaUser,
  Room,
  RoomBlock,
  RoomSeat,
  Showtime
];
