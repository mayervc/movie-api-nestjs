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

describe('GET /users/me/tickets', () => {
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
  let userToken: string;
  let adminUser: User;
  let regularUser: User;

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
    userToken = auth.userToken;
    adminUser = auth.adminUser;
    regularUser = auth.regularUser;
  });

  let sharedShowtimeId: number;
  let seatCounter: number;
  let sharedRoomId: number;
  let sharedBlockId: number;

  async function setupShowtime() {
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
      columnsBlocks: 2,
      details: null,
      cinemaId: cinema.id
    });
    const block = await roomBlockRepository.save({
      rowSeats: 1,
      columnsSeats: 2,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    const showtime = await showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2026-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
    sharedShowtimeId = showtime.id;
    sharedRoomId = room.id;
    sharedBlockId = block.id;
    seatCounter = 1;
  }

  async function createTicketForUser(userId: number) {
    const col = seatCounter++;
    const seat = await roomSeatRepository.save({
      seatRowLabel: 'A',
      seatRow: 1,
      seatColumnLabel: col,
      seatColumn: col,
      roomId: sharedRoomId,
      roomBlockId: sharedBlockId
    });
    return ticketRepository.save({
      userId,
      showtimeId: sharedShowtimeId,
      roomSeatId: seat.id,
      status: TicketStatus.RESERVED
    });
  }

  it('should return 200 with the authenticated user tickets', async () => {
    await setupShowtime();
    await createTicketForUser(regularUser.id);
    await createTicketForUser(regularUser.id);

    const res = await request(app.getHttpServer())
      .get('/users/me/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body[0].userId).toBe(regularUser.id);
  });

  it('should not return tickets belonging to other users', async () => {
    await setupShowtime();
    await createTicketForUser(adminUser.id);
    await createTicketForUser(regularUser.id);

    const res = await request(app.getHttpServer())
      .get('/users/me/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].userId).toBe(regularUser.id);
  });

  it('should return 200 with empty array when user has no tickets', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/users/me/tickets').expect(401);
  });
});
