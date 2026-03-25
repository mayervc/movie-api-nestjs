import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { Cinema } from '../../cinemas/entities/cinema.entity';

@Entity('rooms')
@Unique(['cinemaId', 'name'])
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'rows_blocks', type: 'integer' })
  rowsBlocks: number;

  @Column({ name: 'columns_blocks', type: 'integer' })
  columnsBlocks: number;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @ManyToOne(() => Cinema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cinema_id' })
  cinema: Cinema;

  @Column({ name: 'cinema_id', type: 'integer' })
  cinemaId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
