import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('showtimes')
export class Showtime {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Column({ name: 'movie_id', type: 'integer' })
  movieId: number;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id', type: 'integer' })
  roomId: number;

  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ name: 'ticket_price', type: 'decimal', precision: 10, scale: 2 })
  ticketPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
