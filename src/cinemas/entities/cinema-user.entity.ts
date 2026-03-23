import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cinema_users')
export class CinemaUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cinema_id', type: 'integer' })
  cinemaId: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

