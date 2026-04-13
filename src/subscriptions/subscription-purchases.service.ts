import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './enums/subscription-plan.enum';
import {
  SubscriptionPurchaseItemDto,
  SubscriptionPurchaseResponseDto
} from './dto/subscription-purchase-response.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.BASIC]: 'Básico',
  [SubscriptionPlan.PREMIUM]: 'Premium'
};

@Injectable()
export class SubscriptionPurchasesService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly configService: ConfigService
  ) {}

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
      pagination: {
        page,
        limit: clampedLimit,
        total,
        totalPages: Math.ceil(total / clampedLimit)
      }
    };
  }
}
