import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany
} from 'typeorm';
import { Actor } from '../../actors/entities/actor.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate: Date;

  @Column({ type: 'text', array: true, nullable: true })
  genres: string[];

  @Column()
  duration: number;

  @Column({ default: false })
  trending: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  clasification: string;

  @Column({ name: 'tmdb_id', unique: true, nullable: true })
  tmdbId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Actor, (actor) => actor.movies)
  actors: Actor[];
}
