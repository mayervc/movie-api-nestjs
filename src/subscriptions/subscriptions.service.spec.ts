import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './enums/subscription-plan.enum';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { VerifySubscriptionDto } from './dto/verify-subscription.dto';

const USER_ID = 1;
const OTHER_USER_ID = 2;
const BASIC_AMOUNT = 9.99;
const PREMIUM_AMOUNT = 14.99;
const STRIPE_SESSION_ID = 'cs_test_abc123';
const STRIPE_SESSION_URL = 'https://checkout.stripe.com/pay/cs_test_abc123';
const STRIPE_PRICE_BASIC = 'price_basic_test';
const STRIPE_SUBSCRIPTION_ID = 'sub_test_abc123';
const STRIPE_CUSTOMER_ID = 'cus_test_abc123';
const PERIOD_START_UNIX = 1746057600; // 2026-05-01
const PERIOD_END_UNIX = 1748736000; // 2026-06-01

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
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn()
};

const mockConfigService = {
  get: jest.fn()
};

const mockStripeService = {
  createSubscriptionCheckoutSession: jest.fn(),
  retrieveCheckoutSession: jest.fn(),
  retrieveSubscription: jest.fn(),
  cancelSubscriptionAtPeriodEnd: jest.fn(),
  reactivateSubscription: jest.fn()
};

const mockCompletedSession = {
  id: STRIPE_SESSION_ID,
  status: 'complete',
  payment_status: 'paid',
  subscription: STRIPE_SUBSCRIPTION_ID,
  customer: STRIPE_CUSTOMER_ID
};

const mockStripeSubscription = {
  id: STRIPE_SUBSCRIPTION_ID,
  status: 'active',
  current_period_start: PERIOD_START_UNIX,
  current_period_end: PERIOD_END_UNIX,
  cancel_at_period_end: false,
  items: {
    data: [{ price: { id: STRIPE_PRICE_BASIC } }]
  }
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

  describe('verify', () => {
    const dto: VerifySubscriptionDto = { sessionId: STRIPE_SESSION_ID };

    it('should create and return a new subscription when session is completed', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue(
        mockCompletedSession
      );
      mockStripeService.retrieveSubscription.mockResolvedValue(
        mockStripeSubscription
      );
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_PRICE_BASIC') return STRIPE_PRICE_BASIC;
        return undefined;
      });
      mockSubscriptionsRepository.findOne.mockResolvedValue(null);
      const newSubscription = { userId: USER_ID } as Subscription;
      mockSubscriptionsRepository.create.mockReturnValue(newSubscription);
      mockSubscriptionsRepository.save.mockResolvedValue({
        ...newSubscription,
        id: 1,
        plan: SubscriptionPlan.BASIC,
        status: 'active'
      });

      const result = await service.verify(dto, USER_ID);

      expect(result.plan).toBe(SubscriptionPlan.BASIC);
      expect(result.status).toBe('active');
      expect(mockSubscriptionsRepository.save).toHaveBeenCalled();
    });

    it('should update existing subscription when already exists', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue(
        mockCompletedSession
      );
      mockStripeService.retrieveSubscription.mockResolvedValue(
        mockStripeSubscription
      );
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_PRICE_BASIC') return STRIPE_PRICE_BASIC;
        return undefined;
      });
      mockSubscriptionsRepository.findOne.mockResolvedValue(
        mockBasicSubscription
      );
      mockSubscriptionsRepository.save.mockResolvedValue(mockBasicSubscription);

      const result = await service.verify(dto, USER_ID);

      expect(result).toEqual(mockBasicSubscription);
      expect(mockSubscriptionsRepository.create).not.toHaveBeenCalled();
    });

    it('should throw 400 when session is not completed', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue({
        ...mockCompletedSession,
        status: 'open',
        payment_status: 'unpaid'
      });

      await expect(service.verify(dto, USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw 400 when price ID is unrecognized', async () => {
      mockStripeService.retrieveCheckoutSession.mockResolvedValue(
        mockCompletedSession
      );
      mockStripeService.retrieveSubscription.mockResolvedValue({
        ...mockStripeSubscription,
        items: { data: [{ price: { id: 'price_unknown' } }] }
      });
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.verify(dto, USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reactivate', () => {
    it('should set cancelAtPeriodEnd to false and save when subscription is pending cancellation', async () => {
      const pendingCancelSubscription = {
        ...mockBasicSubscription,
        stripeSubscriptionId: STRIPE_SUBSCRIPTION_ID,
        cancelAtPeriodEnd: true
      } as Subscription;
      mockSubscriptionsRepository.findOne.mockResolvedValue(
        pendingCancelSubscription
      );
      mockStripeService.reactivateSubscription.mockResolvedValue(undefined);
      const saved = { ...pendingCancelSubscription, cancelAtPeriodEnd: false };
      mockSubscriptionsRepository.save.mockResolvedValue(saved);

      const result = await service.reactivate(USER_ID);

      expect(mockStripeService.reactivateSubscription).toHaveBeenCalledWith(
        STRIPE_SUBSCRIPTION_ID
      );
      expect(mockSubscriptionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cancelAtPeriodEnd: false })
      );
      expect(result.cancelAtPeriodEnd).toBe(false);
    });

    it('should throw 400 when no subscription pending cancellation exists', async () => {
      mockSubscriptionsRepository.findOne.mockResolvedValue(null);

      await expect(service.reactivate(USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancel', () => {
    it('should set cancelAtPeriodEnd to true and save when active subscription exists', async () => {
      const activeSubscription = {
        ...mockBasicSubscription,
        stripeSubscriptionId: STRIPE_SUBSCRIPTION_ID,
        cancelAtPeriodEnd: false
      } as Subscription;
      mockSubscriptionsRepository.findOne.mockResolvedValue(activeSubscription);
      mockStripeService.cancelSubscriptionAtPeriodEnd.mockResolvedValue(
        undefined
      );
      const saved = { ...activeSubscription, cancelAtPeriodEnd: true };
      mockSubscriptionsRepository.save.mockResolvedValue(saved);

      const result = await service.cancel(USER_ID);

      expect(
        mockStripeService.cancelSubscriptionAtPeriodEnd
      ).toHaveBeenCalledWith(STRIPE_SUBSCRIPTION_ID);
      expect(mockSubscriptionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ cancelAtPeriodEnd: true })
      );
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it('should throw 404 when no active subscription exists', async () => {
      mockSubscriptionsRepository.findOne.mockResolvedValue(null);

      await expect(service.cancel(USER_ID)).rejects.toThrow(NotFoundException);
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
