import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShowtimeTicket, Showtime]), RoomsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService]
})
export class TicketsModule {}
