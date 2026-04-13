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

const buildSubscription = (
  userId: number,
  plan: SubscriptionPlan,
  overrides: Partial<Subscription> = {}
): Partial<Subscription> => ({
  userId,
  stripeSubscriptionId: `sub_test_${plan}`,
  stripeCustomerId: `cus_test_${plan}`,
  plan,
  status: 'active',
  currentPeriodStart: new Date('2026-04-01'),
  currentPeriodEnd: new Date('2026-05-01'),
  cancelAtPeriodEnd: false,
  discountPercent: 0,
  freeTicketsPerMonth: 2,
  freeTicketsRemaining: 2,
  freeTicketsUsed: 0,
  ...overrides
});

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
      subscriptionRepository.create(
        buildSubscription(regularUser.id, SubscriptionPlan.BASIC)
      )
    );

    const response = await request(app.getHttpServer())
      .get('/subscriptions/my-subscription')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.userId).toBe(regularUser.id);
    expect(response.body.plan).toBe(SubscriptionPlan.BASIC);
    expect(response.body.status).toBe('active');
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

describe('GET /subscriptions', () => {
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

  it('should return 200 with paginated history when subscriptions exist', async () => {
    await subscriptionRepository.save([
      subscriptionRepository.create(
        buildSubscription(regularUser.id, SubscriptionPlan.BASIC)
      ),
      subscriptionRepository.create(
        buildSubscription(regularUser.id, SubscriptionPlan.PREMIUM)
      )
    ]);

    const response = await request(app.getHttpServer())
      .get('/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.purchases).toHaveLength(2);
    expect(response.body.purchases[0]).toMatchObject({
      plan_slug: expect.any(String),
      plan_name: expect.any(String),
      total_amount: expect.any(Number)
    });
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1
    });
  });

  it('should return 200 with empty list when no subscriptions exist', async () => {
    const response = await request(app.getHttpServer())
      .get('/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.purchases).toHaveLength(0);
    expect(response.body.pagination.total).toBe(0);
  });

  it('should respect page and limit query params', async () => {
    await subscriptionRepository.save([
      subscriptionRepository.create(
        buildSubscription(regularUser.id, SubscriptionPlan.BASIC)
      ),
      subscriptionRepository.create(
        buildSubscription(regularUser.id, SubscriptionPlan.PREMIUM)
      )
    ]);

    const response = await request(app.getHttpServer())
      .get('/subscriptions?page=1&limit=1')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.purchases).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2
    });
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/subscriptions').expect(401);
  });
});
