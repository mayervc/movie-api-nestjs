import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './enums/subscription-plan.enum';

const USER_ID = 1;
const OTHER_USER_ID = 2;

const mockSubscription: Partial<Subscription> = {
  id: 1,
  userId: USER_ID,
  stripeSubscriptionId: 'sub_test_abc123',
  stripeCustomerId: 'cus_test_abc123',
  plan: SubscriptionPlan.BASIC,
  status: 'active',
  cancelAtPeriodEnd: false,
  discountPercent: 10,
  freeTicketsPerMonth: 2,
  freeTicketsRemaining: 2,
  freeTicketsUsed: 0
};

const mockSubscriptionsRepository = {
  findOne: jest.fn()
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
        }
      ]
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    jest.clearAllMocks();
  });

  describe('getMySubscription', () => {
    it('should return the subscription when one exists for the user', async () => {
      mockSubscriptionsRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getMySubscription(USER_ID);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionsRepository.findOne).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { createdAt: 'DESC' }
      });
    });

    it('should return null when no subscription exists for the user', async () => {
      mockSubscriptionsRepository.findOne.mockResolvedValue(null);

      const result = await service.getMySubscription(OTHER_USER_ID);

      expect(result).toBeNull();
      expect(mockSubscriptionsRepository.findOne).toHaveBeenCalledWith({
        where: { userId: OTHER_USER_ID },
        order: { createdAt: 'DESC' }
      });
    });
  });
});
