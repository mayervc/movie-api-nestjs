import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Subscription } from '../src/subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../src/subscriptions/enums/subscription-plan.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

describe('GET /subscriptions/my-subscription', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let subscriptionRepository: Repository<Subscription>;
  let dataSource: DataSource;
  let userToken: string;
  let regularUser: User;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();

    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    subscriptionRepository = testModule.get<Repository<Subscription>>(
      getRepositoryToken(Subscription)
    );
    dataSource = userRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['subscriptions', 'users']);
    ({ regularUser, userToken } = await createAdminAndUser(
      userRepository,
      app
    ));
  });

  it('should return 200 with subscription data when one exists', async () => {
    await subscriptionRepository.save(
      subscriptionRepository.create({
        userId: regularUser.id,
        stripeSubscriptionId: 'sub_test_abc123',
        stripeCustomerId: 'cus_test_abc123',
        plan: SubscriptionPlan.BASIC,
        status: 'active',
        currentPeriodStart: new Date('2026-04-01'),
        currentPeriodEnd: new Date('2026-05-01'),
        cancelAtPeriodEnd: false,
        discountPercent: 10,
        freeTicketsPerMonth: 2,
        freeTicketsRemaining: 2,
        freeTicketsUsed: 0
      })
    );

    const response = await request(app.getHttpServer())
      .get('/subscriptions/my-subscription')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.userId).toBe(regularUser.id);
    expect(response.body.plan).toBe(SubscriptionPlan.BASIC);
    expect(response.body.status).toBe('active');
    expect(response.body.stripeSubscriptionId).toBe('sub_test_abc123');
  });

  it('should return 200 with null when no subscription exists', async () => {
    const response = await request(app.getHttpServer())
      .get('/subscriptions/my-subscription')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toEqual({});
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .get('/subscriptions/my-subscription')
      .expect(401);
  });
});
