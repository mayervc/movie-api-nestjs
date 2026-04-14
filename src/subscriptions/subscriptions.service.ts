import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './enums/subscription-plan.enum';
import {
  SubscriptionPurchaseItemDto,
  SubscriptionPurchaseResponseDto
} from './dto/subscription-purchase-response.dto';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { SubscriptionCheckoutResponseDto } from './dto/subscription-checkout-response.dto';
import { VerifySubscriptionDto } from './dto/verify-subscription.dto';
import { StripeService } from '../stripe/stripe.service';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.BASIC]: 'Básico',
  [SubscriptionPlan.PREMIUM]: 'Premium'
};

const STRIPE_PRICE_IDS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.BASIC]: 'STRIPE_PRICE_BASIC',
  [SubscriptionPlan.PREMIUM]: 'STRIPE_PRICE_PREMIUM'
};

const PLAN_CONFIG: Record<
  SubscriptionPlan,
  { freeTicketsPerMonth: number; discountPercent: number }
> = {
  [SubscriptionPlan.BASIC]: { freeTicketsPerMonth: 2, discountPercent: 10 },
  [SubscriptionPlan.PREMIUM]: { freeTicketsPerMonth: 4, discountPercent: 20 }
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService
  ) {}

  async getMySubscription(userId: number): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async createCheckout(
    dto: CreateSubscriptionCheckoutDto
  ): Promise<SubscriptionCheckoutResponseDto> {
    const priceId = this.configService.get<string>(STRIPE_PRICE_IDS[dto.plan]);
    if (!priceId) {
      throw new BadRequestException(
        `Stripe price ID for plan "${dto.plan}" is not configured`
      );
    }

    const { sessionId, url } =
      await this.stripeService.createSubscriptionCheckoutSession({
        priceId,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl
      });

    return { sessionId, url };
  }

  async verify(
    dto: VerifySubscriptionDto,
    userId: number
  ): Promise<Subscription> {
    const session = await this.stripeService.retrieveCheckoutSession(
      dto.sessionId
    );

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException(
        'Subscription checkout session is not completed'
      );
    }

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as { id?: string })?.id;

    if (!stripeSubscriptionId) {
      throw new BadRequestException(
        'No subscription found in checkout session'
      );
    }

    const stripeSub =
      await this.stripeService.retrieveSubscription(stripeSubscriptionId);

    const priceId = stripeSub.items.data[0]?.price?.id;
    const basicPriceId = this.configService.get<string>('STRIPE_PRICE_BASIC');
    const premiumPriceId = this.configService.get<string>(
      'STRIPE_PRICE_PREMIUM'
    );

    let plan: SubscriptionPlan;
    if (priceId === basicPriceId) {
      plan = SubscriptionPlan.BASIC;
    } else if (priceId === premiumPriceId) {
      plan = SubscriptionPlan.PREMIUM;
    } else {
      throw new BadRequestException(`Unrecognized Stripe price ID: ${priceId}`);
    }

    const { freeTicketsPerMonth, discountPercent } = PLAN_CONFIG[plan];

    let subscription = await this.subscriptionsRepository.findOne({
      where: { stripeSubscriptionId }
    });

    if (!subscription) {
      subscription = this.subscriptionsRepository.create({
        userId,
        freeTicketsRemaining: freeTicketsPerMonth,
        freeTicketsUsed: 0
      });
    }

    subscription.stripeSubscriptionId = stripeSubscriptionId;
    subscription.stripeCustomerId = stripeCustomerId ?? null;
    subscription.plan = plan;
    subscription.status = stripeSub.status;
    subscription.currentPeriodStart = new Date(
      stripeSub.current_period_start * 1000
    );
    subscription.currentPeriodEnd = new Date(
      stripeSub.current_period_end * 1000
    );
    subscription.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
    subscription.discountPercent = discountPercent;
    subscription.freeTicketsPerMonth = freeTicketsPerMonth;

    return this.subscriptionsRepository.save(subscription);
  }

  async getSubscriptionHistory(
    userId: number,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT
  ): Promise<SubscriptionPurchaseResponseDto> {
    const clampedLimit = Math.min(limit, MAX_LIMIT);
    const offset = (page - DEFAULT_PAGE) * clampedLimit;

    const [rows, total] = await this.subscriptionsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: clampedLimit
    });

    const basicAmount = this.configService.get<number>(
      'SUBSCRIPTION_PLAN_BASIC_AMOUNT',
      9.99
    );
    const premiumAmount = this.configService.get<number>(
      'SUBSCRIPTION_PLAN_PREMIUM_AMOUNT',
      14.99
    );

    const planAmounts: Record<SubscriptionPlan, number> = {
      [SubscriptionPlan.BASIC]: basicAmount,
      [SubscriptionPlan.PREMIUM]: premiumAmount
    };

    const purchases: SubscriptionPurchaseItemDto[] = rows.map((sub) => ({
      id: sub.id,
      plan_slug: sub.plan,
      plan_name: PLAN_NAMES[sub.plan],
      total_amount: planAmounts[sub.plan],
      created_at: sub.createdAt
    }));

    return {
      purchases,
      total,
      page,
      limit: clampedLimit,
      totalPages: Math.ceil(total / clampedLimit)
    };
  }
}
