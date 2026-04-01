import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Showtime } from '../../showtimes/entities/showtime.entity';
import { RoomSeat } from '../../rooms/entities/room-seat.entity';
import { TicketStatus } from '../enums/ticket-status.enum';

@Entity('showtime_tickets')
export class ShowtimeTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @ManyToOne(() => Showtime, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'showtime_id' })
  showtime: Showtime;

  @Column({ name: 'showtime_id', type: 'integer' })
  showtimeId: number;

  @ManyToOne(() => RoomSeat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_seat_id' })
  roomSeat: RoomSeat;

  @Column({ name: 'room_seat_id', type: 'integer' })
  roomSeatId: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.RESERVED
  })
  status: TicketStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
