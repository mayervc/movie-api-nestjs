import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';

@Entity('actors')
export class Actor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'nick_name', nullable: true })
  nickName: string;

  @Column({ type: 'date', nullable: true })
  birthdate: Date;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    nullable: true
  })
  popularity: number;

  @Column({ name: 'profile_image', nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  character: string;

  @Column({ name: 'tmdb_id', unique: true, nullable: true })
  tmdbId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Movie, (movie) => movie.actors)
  @JoinTable({
    name: 'cast',
    joinColumn: { name: 'actor_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'movie_id', referencedColumnName: 'id' }
  })
  movies: Movie[];
}
