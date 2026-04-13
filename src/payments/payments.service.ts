import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { StripeEvent } from './entities/stripe-event.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { StripeService, ticketPriceToCents } from '../stripe/stripe.service';
import Stripe from 'stripe';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { OrderStatus } from './enums/order-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(StripeEvent)
    private readonly stripeEventsRepository: Repository<StripeEvent>,
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

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
    this.logger.log(`Stripe event object: ${JSON.stringify(event)}`);

    const alreadyProcessed = await this.stripeEventsRepository.findOne({
      where: { stripeEventId: event.id }
    });
    if (alreadyProcessed) {
      return;
    }

    await this.stripeEventsRepository.save(
      this.stripeEventsRepository.create({ stripeEventId: event.id })
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const order = await this.ordersRepository.findOne({
        where: { stripeSessionId: session.id }
      });
      if (order) {
        order.status = OrderStatus.COMPLETED;
        order.stripePaymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null;
        await this.ordersRepository.save(order);
      }
    }
  }

  async findBySessionId(sessionId: string, currentUser: User): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { stripeSessionId: sessionId }
    });
    if (!order) {
      throw new NotFoundException(
        `Order with session ID ${sessionId} not found`
      );
    }
    if (
      order.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return order;
  }
}
