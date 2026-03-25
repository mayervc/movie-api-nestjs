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
import { RoomBlock } from './room-block.entity';

@Entity('room_seats')
export class RoomSeat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'seat_row_label', type: 'varchar' })
  seatRowLabel: string;

  @Column({ name: 'seat_row', type: 'integer' })
  seatRow: number;

  @Column({ name: 'seat_column_label', type: 'integer' })
  seatColumnLabel: number;

  @Column({ name: 'seat_column', type: 'integer' })
  seatColumn: number;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id', type: 'integer' })
  roomId: number;

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
