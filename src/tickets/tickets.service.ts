import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { ShowtimesService } from '../showtimes/showtimes.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeTicket)
    private readonly ticketsRepository: Repository<ShowtimeTicket>,
    private readonly showtimesService: ShowtimesService
  ) {}

  async findByShowtime(
    showtimeId: number,
    userId: number
  ): Promise<ShowtimeTicket[]> {
    // Validates the showtime exists — throws NotFoundException (404) if not found
    await this.showtimesService.findOne(showtimeId);

    return this.ticketsRepository.find({
      where: { showtimeId, userId },
      relations: ['roomSeat']
    });
  }
}
