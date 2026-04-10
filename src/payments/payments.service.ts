import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { StripeService, ticketPriceToCents } from '../stripe/stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { OrderStatus } from './enums/order-status.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Showtime)
    private readonly showtimesRepository: Repository<Showtime>,
    private readonly stripeService: StripeService
  ) {}

  async createCheckoutSession(
    dto: CreateCheckoutSessionDto,
    currentUser: User
  ): Promise<CheckoutSessionResponseDto> {
    const showtime = await this.showtimesRepository.findOne({
      where: { id: dto.showtimeId }
    });
    if (!showtime) {
      throw new NotFoundException(
        `Showtime with ID ${dto.showtimeId} not found`
      );
    }

    const seatCount = dto.seatIds.length;
    const totalCents = ticketPriceToCents(showtime.ticketPrice) * seatCount;

    const { sessionId, url } = await this.stripeService.createCheckoutSession({
      totalCents,
      seatCount,
      showtimeId: showtime.id,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl
    });

    const order = await this.ordersRepository.save(
      this.ordersRepository.create({
        userId: currentUser.id,
        showtimeId: showtime.id,
        stripeSessionId: sessionId,
        stripePaymentIntentId: null,
        status: OrderStatus.PENDING,
        totalCents,
        seatIds: dto.seatIds
      })
    );

    return { sessionId, url, orderId: order.id };
  }
}
