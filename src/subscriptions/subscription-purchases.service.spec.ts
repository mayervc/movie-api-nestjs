import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPurchasesService } from './subscription-purchases.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './enums/subscription-plan.enum';

const USER_ID = 1;
const BASIC_AMOUNT = 9.99;
const PREMIUM_AMOUNT = 14.99;

const mockBasicSubscription = {
  id: 1,
  userId: USER_ID,
  plan: SubscriptionPlan.BASIC,
  createdAt: new Date('2026-01-01T00:00:00.000Z')
} as Subscription;

const mockPremiumSubscription = {
  id: 2,
  userId: USER_ID,
  plan: SubscriptionPlan.PREMIUM,
  createdAt: new Date('2026-02-01T00:00:00.000Z')
} as Subscription;

const mockSubscriptionsRepository = {
  findAndCount: jest.fn()
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue: number) => defaultValue)
};

describe('SubscriptionPurchasesService', () => {
  let service: SubscriptionPurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPurchasesService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionsRepository
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<SubscriptionPurchasesService>(
      SubscriptionPurchasesService
    );
    jest.clearAllMocks();
  });

  describe('getSubscriptionHistory', () => {
    it('should return paginated purchases with correct shape', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([
        [mockPremiumSubscription, mockBasicSubscription],
        2
      ]);

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
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
    });

    it('should return empty purchases list when user has no subscriptions', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getSubscriptionHistory(USER_ID, 1, 20);

      expect(result.purchases).toHaveLength(0);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      });
    });

    it('should clamp limit to MAX_LIMIT (50) when exceeded', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getSubscriptionHistory(USER_ID, 1, 100);

      expect(result.pagination.limit).toBe(50);
      expect(mockSubscriptionsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });

    it('should calculate correct offset for page 2', async () => {
      mockSubscriptionsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getSubscriptionHistory(USER_ID, 2, 20);

      expect(mockSubscriptionsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 })
      );
    });
  });
});
