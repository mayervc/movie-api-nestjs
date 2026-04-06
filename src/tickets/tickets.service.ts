import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimeTicket } from './entities/showtime-ticket.entity';
import { ShowtimesService } from '../showtimes/showtimes.service';
import { RoomsService } from '../rooms/rooms.service';
import { PurchaseTicketsDto } from './dto/purchase-tickets.dto';
import { TicketStatus } from './enums/ticket-status.enum';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeTicket)
    private readonly ticketsRepository: Repository<ShowtimeTicket>,
    private readonly showtimesService: ShowtimesService,
    private readonly roomsService: RoomsService
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

  async purchase(
    dto: PurchaseTicketsDto,
    userId: number
  ): Promise<ShowtimeTicket[]> {
    await this.showtimesService.findOne(dto.showtimeId);

    for (const roomSeatId of dto.roomSeatIds) {
      await this.roomsService.findOneSeat(roomSeatId);

      const existing = await this.ticketsRepository.findOne({
        where: {
          showtimeId: dto.showtimeId,
          roomSeatId
        }
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
