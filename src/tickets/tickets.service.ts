import {
  BadRequestException,
  ForbiddenException,
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
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { StripeService, ticketPriceToCents } from '../stripe/stripe.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ShowtimeTicket)
    private readonly ticketsRepository: Repository<ShowtimeTicket>,
    @InjectRepository(Showtime)
    private readonly showtimesRepository: Repository<Showtime>,
    private readonly roomsService: RoomsService,
    private readonly stripeService: StripeService
  ) {}

  private async assertShowtimeExists(showtimeId: number): Promise<void> {
    const showtime = await this.showtimesRepository.findOne({
      where: { id: showtimeId }
    });
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID ${showtimeId} not found`);
    }
  }

  async findOne(id: number, currentUser: User): Promise<ShowtimeTicket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['roomSeat', 'showtime']
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    if (
      ticket.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    return ticket;
  }

  async findByUser(userId: number): Promise<ShowtimeTicket[]> {
    return this.ticketsRepository.find({
      where: { userId },
      relations: ['roomSeat', 'showtime']
    });
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
    const showtime = await this.showtimesRepository.findOne({
      where: { id: dto.showtimeId }
    });
    if (!showtime) {
      throw new NotFoundException(
        `Showtime with ID ${dto.showtimeId} not found`
      );
    }

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

    if (dto.paymentIntentId) {
      await this.stripeService.assertPaymentIntentMatchesPurchase(
        dto.paymentIntentId,
        showtime.ticketPrice,
        dto.roomSeatIds.length
      );
    }

    const paymentIntentId = dto.paymentIntentId ?? null;

    const tickets = dto.roomSeatIds.map((roomSeatId) =>
      this.ticketsRepository.create({
        userId,
        showtimeId: dto.showtimeId,
        roomSeatId,
        status: TicketStatus.RESERVED,
        stripePaymentIntentId: paymentIntentId
      })
    );

    return this.ticketsRepository.save(tickets);
  }

  async cancel(id: number, currentUser: User): Promise<void> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['showtime']
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    if (
      ticket.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    if (ticket.showtime.startTime <= new Date()) {
      throw new BadRequestException(
        'Cannot cancel a ticket for a showtime that has already started'
      );
    }
    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Ticket is already cancelled');
    }

    if (ticket.stripePaymentIntentId) {
      const amountCents = ticketPriceToCents(ticket.showtime.ticketPrice);
      await this.stripeService.refundSingleSeat({
        paymentIntentId: ticket.stripePaymentIntentId,
        amountCents,
        idempotencyKey: `showtime-ticket-cancel-${ticket.id}`
      });
    }

    ticket.status = TicketStatus.CANCELLED;
    await this.ticketsRepository.save(ticket);
  }
}
