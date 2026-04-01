import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeTicket)
    private readonly ticketsRepository: Repository<ShowtimeTicket>
  ) {}
}
