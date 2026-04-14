import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './enums/subscription-plan.enum';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';

const USER_ID = 1;
const OTHER_USER_ID = 2;
const BASIC_AMOUNT = 9.99;
const PREMIUM_AMOUNT = 14.99;
const STRIPE_SESSION_ID = 'cs_test_abc123';
const STRIPE_SESSION_URL = 'https://checkout.stripe.com/pay/cs_test_abc123';
const STRIPE_PRICE_BASIC = 'price_basic_test';

const mockBasicSubscription = {
  id: 1,
  userId: USER_ID,
  plan: SubscriptionPlan.BASIC,
  status: 'active',
  cancelAtPeriodEnd: false,
  discountPercent: 10,
  freeTicketsPerMonth: 2,
  freeTicketsRemaining: 2,
  freeTicketsUsed: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z')
} as Subscription;

const mockPremiumSubscription = {
  id: 2,
  userId: USER_ID,
  plan: SubscriptionPlan.PREMIUM,
  createdAt: new Date('2026-02-01T00:00:00.000Z')
} as Subscription;

const mockSubscriptionsRepository = {
  findOne: jest.fn(),
  findAndCount: jest.fn()
};

const mockConfigService = {
  get: jest.fn()
};

const mockStripeService = {
  createSubscriptionCheckoutSession: jest.fn()
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionsRepository
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: StripeService, useValue: mockStripeService }
      ]
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    jest.clearAllMocks();
  });

  describe('getMySubscription', () => {
    it('should return the subscription when one exists for the user', async () => {
      mockSubscriptionsRepository.findOne.mockResolvedValue(
        mockBasicSubscription
      );

      const result = await service.getMySubscription(USER_ID);

      expect(result).toEqual(mockBasicSubscription);
      expect(mockSubscriptionsRepository.findOne).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { createdAt: 'DESC' }
      });
    });

    it('should return null when no subscription exists for the user', async () => {
      mockSubscriptionsRepository.findOne.mockResolvedValue(null);

      const result = await service.getMySubscription(OTHER_USER_ID);

      expect(result).toBeNull();
    });
  });

  describe('createCheckout', () => {
    const dto: CreateSubscriptionCheckoutDto = {
      plan: SubscriptionPlan.BASIC,
      successUrl: 'https://app.com/success',
      cancelUrl: 'https://app.com/cancel'
    };

    it('should return sessionId and url on success', async () => {
      mockConfigService.get.mockReturnValue(STRIPE_PRICE_BASIC);
      mockStripeService.createSubscriptionCheckoutSession.mockResolvedValue({
        sessionId: STRIPE_SESSION_ID,
        url: STRIPE_SESSION_URL
      });

      const result = await service.createCheckout(dto);

      expect(result).toEqual({
        sessionId: STRIPE_SESSION_ID,
        url: STRIPE_SESSION_URL
      });
      expect(
        mockStripeService.createSubscriptionCheckoutSession
      ).toHaveBeenCalledWith({
        priceId: STRIPE_PRICE_BASIC,
        successUrl: dto.successUrl,
        cancelUrl: dto.cancelUrl
      });
    });

    it('should throw 400 when Stripe price ID is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.createCheckout(dto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getSubscriptionHistory', () => {
    it('should return paginated purchases with correct flat shape', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([
        [mockPremiumSubscription, mockBasicSubscription],
        2
      ]);
      mockConfigService.get.mockImplementation(
        (_key: string, defaultValue: number) => defaultValue
      );

      const result = await service.getSubscriptionHistory(USER_ID, 1, 20);

      expect(result.purchases).toHaveLength(2);
      expect(result.purchases[0]).toMatchObject({
        id: mockPremiumSubscription.id,
        plan_slug: SubscriptionPlan.PREMIUM,
        plan_name: 'Premium',
        total_amount: PREMIUM_AMOUNT
      });
      expect(result.purchases[1]).toMatchObject({
        id: mockBasicSubscription.id,
        plan_slug: SubscriptionPlan.BASIC,
        plan_name: 'Básico',
        total_amount: BASIC_AMOUNT
      });
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should return empty purchases list when user has no subscriptions', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([[], 0]);
      mockConfigService.get.mockImplementation(
        (_key: string, defaultValue: number) => defaultValue
      );

      const result = await service.getSubscriptionHistory(USER_ID, 1, 20);

      expect(result.purchases).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should clamp limit to MAX_LIMIT (50) when exceeded', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([[], 0]);
      mockConfigService.get.mockImplementation(
        (_key: string, defaultValue: number) => defaultValue
      );

      const result = await service.getSubscriptionHistory(USER_ID, 1, 100);

      expect(result.limit).toBe(50);
      expect(mockSubscriptionsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });

    it('should calculate correct offset for page 2', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([[], 0]);
      mockConfigService.get.mockImplementation(
        (_key: string, defaultValue: number) => defaultValue
      );

      await service.getSubscriptionHistory(USER_ID, 2, 20);

      expect(mockSubscriptionsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 })
      );
    });
  });
});
