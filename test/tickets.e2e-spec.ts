import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShowtimeTicket } from '../src/tickets/entities/showtime-ticket.entity';
import { Showtime } from '../src/showtimes/entities/showtime.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { Room } from '../src/rooms/entities/room.entity';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { RoomSeat } from '../src/rooms/entities/room-seat.entity';
import { RoomBlock } from '../src/rooms/entities/room-block.entity';
import { User } from '../src/users/entities/user.entity';
import { TicketStatus } from '../src/tickets/enums/ticket-status.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

describe('GET /showtimes/:id/tickets', () => {
  let app: INestApplication;
  let ticketRepository: Repository<ShowtimeTicket>;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let roomSeatRepository: Repository<RoomSeat>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUser: User;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    ticketRepository = testModule.get<Repository<ShowtimeTicket>>(
      getRepositoryToken(ShowtimeTicket)
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
    roomSeatRepository = testModule.get<Repository<RoomSeat>>(
      getRepositoryToken(RoomSeat)
    );
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = ticketRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'showtime_tickets',
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    adminUser = auth.adminUser;
  });

  async function createShowtimeWithSeat() {
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
    const block = await roomBlockRepository.save({
      rowSeats: 1,
      columnsSeats: 1,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    const seat = await roomSeatRepository.save({
      seatRowLabel: 'A',
      seatRow: 1,
      seatColumnLabel: 1,
      seatColumn: 1,
      roomId: room.id,
      roomBlockId: block.id
    });
    const showtime = await showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2026-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
    return { showtime, seat };
  }

  it('should return 200 with the user tickets for the showtime', async () => {
    const { showtime, seat } = await createShowtimeWithSeat();

    await ticketRepository.save({
      userId: adminUser.id,
      showtimeId: showtime.id,
      roomSeatId: seat.id,
      status: TicketStatus.RESERVED
    });

    const res = await request(app.getHttpServer())
      .get(`/showtimes/${showtime.id}/tickets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].showtimeId).toBe(showtime.id);
    expect(res.body[0].userId).toBe(adminUser.id);
    expect(res.body[0].status).toBe(TicketStatus.RESERVED);
  });

  it('should return 200 with empty array when user has no tickets for the showtime', async () => {
    const { showtime } = await createShowtimeWithSeat();

    const res = await request(app.getHttpServer())
      .get(`/showtimes/${showtime.id}/tickets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/showtimes/1/tickets').expect(401);
  });

  it('should return 404 when showtime does not exist', async () => {
    await request(app.getHttpServer())
      .get('/showtimes/99999/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

describe('POST /tickets', () => {
  let app: INestApplication;
  let ticketRepository: Repository<ShowtimeTicket>;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let roomSeatRepository: Repository<RoomSeat>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUser: User;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    ticketRepository = testModule.get<Repository<ShowtimeTicket>>(
      getRepositoryToken(ShowtimeTicket)
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
    roomSeatRepository = testModule.get<Repository<RoomSeat>>(
      getRepositoryToken(RoomSeat)
    );
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = ticketRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'showtime_tickets',
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    adminUser = auth.adminUser;
  });

  async function createShowtimeWithSeat() {
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
    const block = await roomBlockRepository.save({
      rowSeats: 1,
      columnsSeats: 1,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    const seat = await roomSeatRepository.save({
      seatRowLabel: 'A',
      seatRow: 1,
      seatColumnLabel: 1,
      seatColumn: 1,
      roomId: room.id,
      roomBlockId: block.id
    });
    const showtime = await showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2026-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
    return { showtime, seat };
  }

  it('should return 201 with created tickets', async () => {
    const { showtime, seat } = await createShowtimeWithSeat();

    const res = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ showtimeId: showtime.id, roomSeatIds: [seat.id] })
      .expect(201);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].showtimeId).toBe(showtime.id);
    expect(res.body[0].roomSeatId).toBe(seat.id);
    expect(res.body[0].userId).toBe(adminUser.id);
    expect(res.body[0].status).toBe(TicketStatus.RESERVED);
  });

  it('should return 400 when seat is already taken', async () => {
    const { showtime, seat } = await createShowtimeWithSeat();

    await ticketRepository.save({
      userId: adminUser.id,
      showtimeId: showtime.id,
      roomSeatId: seat.id,
      status: TicketStatus.RESERVED
    });

    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ showtimeId: showtime.id, roomSeatIds: [seat.id] })
      .expect(400);
  });

  it('should return 400 on validation failure', async () => {
    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ showtimeId: 'invalid', roomSeatIds: [] })
      .expect(400);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/tickets')
      .send({ showtimeId: 1, roomSeatIds: [1] })
      .expect(401);
  });

  it('should return 404 when showtime does not exist', async () => {
    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ showtimeId: 99999, roomSeatIds: [1] })
      .expect(404);
  });

  it('should return 404 when seat does not exist', async () => {
    const { showtime } = await createShowtimeWithSeat();

    await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ showtimeId: showtime.id, roomSeatIds: [99999] })
      .expect(404);
  });
});
