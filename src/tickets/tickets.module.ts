import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { ShowtimesModule } from '../showtimes/showtimes.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShowtimeTicket]), ShowtimesModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService]
})
export class TicketsModule {}
