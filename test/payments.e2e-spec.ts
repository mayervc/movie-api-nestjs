import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order } from '../src/payments/entities/order.entity';
import { Showtime } from '../src/showtimes/entities/showtime.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { Room } from '../src/rooms/entities/room.entity';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { RoomBlock } from '../src/rooms/entities/room-block.entity';
import { User } from '../src/users/entities/user.entity';
import { OrderStatus } from '../src/payments/enums/order-status.enum';
import { StripeEvent } from '../src/payments/entities/stripe-event.entity';
import { StripeService } from '../src/stripe/stripe.service';
import Stripe from 'stripe';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

const STRIPE_SESSION_ID = 'cs_test_mock_session_id';
const STRIPE_SESSION_URL = 'https://checkout.stripe.com/pay/cs_test_mock';

describe('POST /payments/create-checkout-session', () => {
  let app: INestApplication;
  let orderRepository: Repository<Order>;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();

    orderRepository = testModule.get<Repository<Order>>(
      getRepositoryToken(Order)
    );
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    roomBlockRepository = testModule.get<Repository<RoomBlock>>(
      getRepositoryToken(RoomBlock)
    );
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = orderRepository.manager.connection;

    const stripeService = testModule.get<StripeService>(StripeService);
    jest.spyOn(stripeService, 'createCheckoutSession').mockResolvedValue({
      sessionId: STRIPE_SESSION_ID,
      url: STRIPE_SESSION_URL
    });
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'orders',
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    userToken = auth.userToken;
  });

  async function createShowtime() {
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    const movie = await movieRepository.save({
      title: 'Test Movie',
      synopsis: 'Test synopsis',
      genres: ['ACTION'],
      releaseDate: new Date('2026-01-01'),
      duration: 120,
      rating: 8.0,
      language: 'EN',
      posterUrl: null,
      trailerUrl: null
    });
    const room = await roomRepository.save({
      name: 'Sala 1',
      rowsBlocks: 1,
      columnsBlocks: 1,
      details: null,
      cinemaId: cinema.id
    });
    await roomBlockRepository.save({
      rowSeats: 2,
      columnsSeats: 2,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    return showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2027-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
  }

  it('should return 201 with sessionId, url and orderId', async () => {
    const showtime = await createShowtime();

    const res = await request(app.getHttpServer())
      .post('/payments/create-checkout-session')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId: showtime.id,
        seatIds: [1, 2],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })
      .expect(201);

    expect(res.body.sessionId).toBe(STRIPE_SESSION_ID);
    expect(res.body.url).toBe(STRIPE_SESSION_URL);
    expect(res.body.orderId).toBeDefined();

    const order = await orderRepository.findOne({
      where: { id: res.body.orderId }
    });
    expect(order?.status).toBe(OrderStatus.PENDING);
    expect(order?.stripeSessionId).toBe(STRIPE_SESSION_ID);
    expect(order?.totalCents).toBe(1998);
    expect(order?.seatIds).toEqual([1, 2]);
  });

  it('should return 400 on validation failure', async () => {
    await request(app.getHttpServer())
      .post('/payments/create-checkout-session')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showtimeId: 'invalid', seatIds: [] })
      .expect(400);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/payments/create-checkout-session')
      .send({
        showtimeId: 1,
        seatIds: [1],
        successUrl: 'https://a.com',
        cancelUrl: 'https://b.com'
      })
      .expect(401);
  });

  it('should return 404 when showtime does not exist', async () => {
    await request(app.getHttpServer())
      .post('/payments/create-checkout-session')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showtimeId: 99999,
        seatIds: [1],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })
      .expect(404);
  });
});

describe('GET /payments/order-by-session', () => {
  let app: INestApplication;
  let orderRepository: Repository<Order>;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let adminUser: User;
  let regularUser: User;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    orderRepository = testModule.get<Repository<Order>>(
      getRepositoryToken(Order)
    );
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    roomBlockRepository = testModule.get<Repository<RoomBlock>>(
      getRepositoryToken(RoomBlock)
    );
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = orderRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'orders',
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    adminUser = auth.adminUser;
    regularUser = auth.regularUser;
  });

  async function createOrderForUser(userId: number) {
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    const movie = await movieRepository.save({
      title: 'Test Movie',
      synopsis: 'Test synopsis',
      genres: ['ACTION'],
      releaseDate: new Date('2026-01-01'),
      duration: 120,
      rating: 8.0,
      language: 'EN',
      posterUrl: null,
      trailerUrl: null
    });
    const room = await roomRepository.save({
      name: 'Sala 1',
      rowsBlocks: 1,
      columnsBlocks: 1,
      details: null,
      cinemaId: cinema.id
    });
    await roomBlockRepository.save({
      rowSeats: 1,
      columnsSeats: 1,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    const showtime = await showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2027-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
    return orderRepository.save({
      userId,
      showtimeId: showtime.id,
      stripeSessionId: STRIPE_SESSION_ID,
      stripePaymentIntentId: null,
      status: OrderStatus.PENDING,
      totalCents: 999,
      seatIds: [1]
    });
  }

  it('should return 200 with order when owner requests it', async () => {
    await createOrderForUser(regularUser.id);

    const res = await request(app.getHttpServer())
      .get(`/payments/order-by-session?sessionId=${STRIPE_SESSION_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.stripeSessionId).toBe(STRIPE_SESSION_ID);
    expect(res.body.userId).toBe(regularUser.id);
    expect(res.body.status).toBe(OrderStatus.PENDING);
  });

  it('should return 200 when ADMIN requests any order', async () => {
    await createOrderForUser(regularUser.id);

    const res = await request(app.getHttpServer())
      .get(`/payments/order-by-session?sessionId=${STRIPE_SESSION_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.stripeSessionId).toBe(STRIPE_SESSION_ID);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .get(`/payments/order-by-session?sessionId=${STRIPE_SESSION_ID}`)
      .expect(401);
  });

  it('should return 403 when user is not the owner', async () => {
    await createOrderForUser(adminUser.id);

    await request(app.getHttpServer())
      .get(`/payments/order-by-session?sessionId=${STRIPE_SESSION_ID}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should return 404 when order does not exist', async () => {
    await request(app.getHttpServer())
      .get('/payments/order-by-session?sessionId=cs_nonexistent')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

const STRIPE_EVENT_ID = 'evt_test_mock_123';
const STRIPE_PAYMENT_INTENT_ID = 'pi_test_mock_456';

describe('POST /payments/webhook', () => {
  let app: INestApplication;
  let orderRepository: Repository<Order>;
  let stripeEventRepository: Repository<StripeEvent>;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    orderRepository = testModule.get<Repository<Order>>(
      getRepositoryToken(Order)
    );
    stripeEventRepository = testModule.get<Repository<StripeEvent>>(
      getRepositoryToken(StripeEvent)
    );
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    roomBlockRepository = testModule.get<Repository<RoomBlock>>(
      getRepositoryToken(RoomBlock)
    );
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = orderRepository.manager.connection;

    const stripeService = testModule.get<StripeService>(StripeService);
    jest
      .spyOn(stripeService, 'constructWebhookEvent')
      .mockImplementation(() => {
        return {
          id: STRIPE_EVENT_ID,
          type: 'checkout.session.completed',
          data: {
            object: {
              id: STRIPE_SESSION_ID,
              payment_intent: STRIPE_PAYMENT_INTENT_ID
            }
          }
        } as unknown as Stripe.Event;
      });
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'orders',
      'stripe_events',
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
  });

  async function createPendingOrder(userId: number) {
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    const movie = await movieRepository.save({
      title: 'Test Movie',
      synopsis: 'Test synopsis',
      genres: ['ACTION'],
      releaseDate: new Date('2026-01-01'),
      duration: 120,
      rating: 8.0,
      language: 'EN',
      posterUrl: null,
      trailerUrl: null
    });
    const room = await roomRepository.save({
      name: 'Sala 1',
      rowsBlocks: 1,
      columnsBlocks: 1,
      details: null,
      cinemaId: cinema.id
    });
    await roomBlockRepository.save({
      rowSeats: 1,
      columnsSeats: 1,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    const showtime = await showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2027-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
    return orderRepository.save({
      userId,
      showtimeId: showtime.id,
      stripeSessionId: STRIPE_SESSION_ID,
      stripePaymentIntentId: null,
      status: OrderStatus.PENDING,
      totalCents: 999,
      seatIds: [1]
    });
  }

  it('should return 200 and update order to completed', async () => {
    const auth = await createAdminAndUser(userRepository, app);
    const order = await createPendingOrder(auth.regularUser.id);

    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('stripe-signature', 'mock-sig')
      .send({})
      .expect(200);

    const updated = await orderRepository.findOne({ where: { id: order.id } });
    expect(updated?.status).toBe(OrderStatus.COMPLETED);
    expect(updated?.stripePaymentIntentId).toBe(STRIPE_PAYMENT_INTENT_ID);

    const event = await stripeEventRepository.findOne({
      where: { stripeEventId: STRIPE_EVENT_ID }
    });
    expect(event).toBeDefined();
  });

  it('should return 200 and be idempotent on duplicate event', async () => {
    const auth = await createAdminAndUser(userRepository, app);
    await createPendingOrder(auth.regularUser.id);

    await stripeEventRepository.save(
      stripeEventRepository.create({ stripeEventId: STRIPE_EVENT_ID })
    );

    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('stripe-signature', 'mock-sig')
      .send({})
      .expect(200);

    const events = await stripeEventRepository.find({
      where: { stripeEventId: STRIPE_EVENT_ID }
    });
    expect(events).toHaveLength(1);
  });

  it('should return 400 when signature verification fails', async () => {
    const testModule = getTestModule();
    const stripeService = testModule.get<StripeService>(StripeService);
    jest
      .spyOn(stripeService, 'constructWebhookEvent')
      .mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('stripe-signature', 'bad-sig')
      .send({})
      .expect(400);
  });
});
