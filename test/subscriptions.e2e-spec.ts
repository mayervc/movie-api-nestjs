import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Subscription } from '../src/subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../src/subscriptions/enums/subscription-plan.enum';
import { StripeService } from '../src/stripe/stripe.service';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

const STRIPE_SESSION_ID = 'cs_test_mock_sub_session';
const STRIPE_SESSION_URL = 'https://checkout.stripe.com/pay/cs_test_mock_sub';
const STRIPE_SUBSCRIPTION_ID = 'sub_test_mock_abc123';
const STRIPE_CUSTOMER_ID = 'cus_test_mock_abc123';
const STRIPE_PRICE_BASIC = 'price_basic_test';
const PERIOD_START_UNIX = 1746057600;
const PERIOD_END_UNIX = 1748736000;

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
    expect(response.body.total).toBe(2);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
    expect(response.body.totalPages).toBe(1);
  });

  it('should return 200 with empty list when no subscriptions exist', async () => {
    const response = await request(app.getHttpServer())
      .get('/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.purchases).toHaveLength(0);
    expect(response.body.total).toBe(0);
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
    expect(response.body.total).toBe(2);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(1);
    expect(response.body.totalPages).toBe(2);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/subscriptions').expect(401);
  });
});

describe('POST /subscriptions/create-checkout', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = userRepository.manager.connection;

    const stripeService = testModule.get<StripeService>(StripeService);
    jest
      .spyOn(stripeService, 'createSubscriptionCheckoutSession')
      .mockResolvedValue({
        sessionId: STRIPE_SESSION_ID,
        url: STRIPE_SESSION_URL
      });
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['subscriptions', 'users']);
    ({ userToken } = await createAdminAndUser(userRepository, app));
  });

  it('should return 201 with sessionId and url on success', async () => {
    const response = await request(app.getHttpServer())
      .post('/subscriptions/create-checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        plan: SubscriptionPlan.BASIC,
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      })
      .expect(201);

    expect(response.body.sessionId).toBe(STRIPE_SESSION_ID);
    expect(response.body.url).toBe(STRIPE_SESSION_URL);
  });

  it('should return 400 when plan is invalid', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions/create-checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        plan: 'invalid_plan',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      })
      .expect(400);
  });

  it('should return 400 when required fields are missing', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions/create-checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({})
      .expect(400);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions/create-checkout')
      .send({
        plan: SubscriptionPlan.BASIC,
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel'
      })
      .expect(401);
  });
});

describe('POST /subscriptions/cancel', () => {
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

    const stripeService = testModule.get<StripeService>(StripeService);
    jest
      .spyOn(stripeService, 'cancelSubscriptionAtPeriodEnd')
      .mockResolvedValue({} as any);
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['subscriptions', 'users']);
    ({ regularUser, userToken } = await createAdminAndUser(
      userRepository,
      app
    ));
  });

  it('should return 200 with cancelAtPeriodEnd=true when active subscription exists', async () => {
    await subscriptionRepository.save(
      subscriptionRepository.create(
        buildSubscription(regularUser.id, SubscriptionPlan.BASIC, {
          cancelAtPeriodEnd: false
        })
      )
    );

    const response = await request(app.getHttpServer())
      .post('/subscriptions/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.userId).toBe(regularUser.id);
    expect(response.body.cancelAtPeriodEnd).toBe(true);
  });

  it('should return 404 when no active subscription exists', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions/cancel')
      .expect(401);
  });
});

describe('POST /subscriptions/verify', () => {
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

    const stripeService = testModule.get<StripeService>(StripeService);
    jest.spyOn(stripeService, 'retrieveCheckoutSession').mockResolvedValue({
      id: STRIPE_SESSION_ID,
      status: 'complete',
      payment_status: 'paid',
      subscription: STRIPE_SUBSCRIPTION_ID,
      customer: STRIPE_CUSTOMER_ID
    } as any);
    jest.spyOn(stripeService, 'retrieveSubscription').mockResolvedValue({
      id: STRIPE_SUBSCRIPTION_ID,
      status: 'active',
      current_period_start: PERIOD_START_UNIX,
      current_period_end: PERIOD_END_UNIX,
      cancel_at_period_end: false,
      items: { data: [{ price: { id: STRIPE_PRICE_BASIC } }] }
    } as any);
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['subscriptions', 'users']);
    ({ regularUser, userToken } = await createAdminAndUser(
      userRepository,
      app
    ));
  });

  it('should return 200 and create subscription record on completed session', async () => {
    const response = await request(app.getHttpServer())
      .post('/subscriptions/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ sessionId: STRIPE_SESSION_ID })
      .expect(200);

    expect(response.body.userId).toBe(regularUser.id);
    expect(response.body.plan).toBe(SubscriptionPlan.BASIC);
    expect(response.body.status).toBe('active');
    expect(response.body.stripeSubscriptionId).toBe(STRIPE_SUBSCRIPTION_ID);
    expect(response.body.stripeCustomerId).toBe(STRIPE_CUSTOMER_ID);

    const saved = await subscriptionRepository.findOne({
      where: { stripeSubscriptionId: STRIPE_SUBSCRIPTION_ID }
    });
    expect(saved).not.toBeNull();
  });

  it('should return 400 when session is not completed', async () => {
    const testModule = getTestModule();
    const stripeService = testModule.get<StripeService>(StripeService);
    jest.spyOn(stripeService, 'retrieveCheckoutSession').mockResolvedValueOnce({
      id: STRIPE_SESSION_ID,
      status: 'open',
      payment_status: 'unpaid'
    } as any);

    await request(app.getHttpServer())
      .post('/subscriptions/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ sessionId: STRIPE_SESSION_ID })
      .expect(400);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/subscriptions/verify')
      .send({ sessionId: STRIPE_SESSION_ID })
      .expect(401);
  });
});
