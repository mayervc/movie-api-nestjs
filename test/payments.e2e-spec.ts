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
import { StripeService } from '../src/stripe/stripe.service';
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
