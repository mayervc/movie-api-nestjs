import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Room } from './room.entity';

@Entity('room_blocks')
export class RoomBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'row_seats', type: 'integer' })
  rowSeats: number;

  @Column({ name: 'columns_seats', type: 'integer' })
  columnsSeats: number;

  @Column({ name: 'block_row', type: 'integer' })
  blockRow: number;

  @Column({ name: 'block_column', type: 'integer' })
  blockColumn: number;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id', type: 'integer' })
  roomId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
