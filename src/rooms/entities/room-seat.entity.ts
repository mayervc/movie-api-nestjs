import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { RoomBlock } from './room-block.entity';

@Entity('room_seats')
export class RoomSeat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'seat_number', type: 'varchar' })
  seatNumber: string;

  @ManyToOne(() => RoomBlock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_block_id' })
  roomBlock: RoomBlock;

  @Column({ name: 'room_block_id', type: 'integer' })
  roomBlockId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
