import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { RoomsService } from '../rooms/rooms.service';
import { PurchaseTicketsDto } from './dto/purchase-tickets.dto';
import { TicketStatus } from './enums/ticket-status.enum';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeTicket)
    private readonly ticketsRepository: Repository<ShowtimeTicket>,
    @InjectRepository(Showtime)
    private readonly showtimesRepository: Repository<Showtime>,
    private readonly roomsService: RoomsService
  ) {}

  private async assertShowtimeExists(showtimeId: number): Promise<void> {
    const showtime = await this.showtimesRepository.findOne({
      where: { id: showtimeId }
    });
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${showtimeId} not found`);
    }
  }

  async findByShowtime(
    showtimeId: number,
    userId: number
  ): Promise<ShowtimeTicket[]> {
    await this.assertShowtimeExists(showtimeId);

    return this.ticketsRepository.find({
      where: { showtimeId, userId },
      relations: ['roomSeat']
    });
  }

  async purchase(
    dto: PurchaseTicketsDto,
    userId: number
  ): Promise<ShowtimeTicket[]> {
    await this.assertShowtimeExists(dto.showtimeId);

    for (const roomSeatId of dto.roomSeatIds) {
      await this.roomsService.findOneSeat(roomSeatId);

      const existing = await this.ticketsRepository.findOne({
        where: { showtimeId: dto.showtimeId, roomSeatId }
      });

      if (existing && existing.status !== TicketStatus.CANCELLED) {
        throw new BadRequestException(
          `Seat with ID ${roomSeatId} is already taken for this showtime`
        );
      }
    }

    const tickets = dto.roomSeatIds.map((roomSeatId) =>
      this.ticketsRepository.create({
        userId,
        showtimeId: dto.showtimeId,
        roomSeatId,
        status: TicketStatus.RESERVED
      })
    );

    return this.ticketsRepository.save(tickets);
  }
}
