import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Showtime } from '../src/showtimes/entities/showtime.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { Room } from '../src/rooms/entities/room.entity';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { User } from '../src/users/entities/user.entity';
import { createAdminAndUser } from './test-auth.helper';

describe('POST /showtimes/search', () => {
  let app: INestApplication;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let dataSource: DataSource;

  let movieId: number;
  let roomId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    dataSource = showtimeRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);

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
    movieId = movie.id;

    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    const room = await roomRepository.save({
      name: 'Sala 1',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId: cinema.id
    });
    roomId = room.id;
  });

  it('should return 200 with all showtimes when no filters', async () => {
    await showtimeRepository.save([
      {
        movieId,
        roomId,
        startTime: new Date('2026-04-01T20:00:00Z'),
        ticketPrice: 9.99
      },
      {
        movieId,
        roomId,
        startTime: new Date('2026-04-02T20:00:00Z'),
        ticketPrice: 9.99
      }
    ]);

    const res = await request(app.getHttpServer())
      .post('/showtimes/search')
      .send({})
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it('should filter by movieId', async () => {
    const otherMovie = await movieRepository.save({
      title: 'Other Movie',
      synopsis: 'Other synopsis',
      genres: ['DRAMA'],
      releaseDate: new Date('2026-01-01'),
      duration: 90,
      rating: 7.0,
      language: 'EN',
      posterUrl: null,
      trailerUrl: null
    });

    await showtimeRepository.save([
      {
        movieId,
        roomId,
        startTime: new Date('2026-04-01T20:00:00Z'),
        ticketPrice: 9.99
      },
      {
        movieId: otherMovie.id,
        roomId,
        startTime: new Date('2026-04-01T22:00:00Z'),
        ticketPrice: 9.99
      }
    ]);

    const res = await request(app.getHttpServer())
      .post('/showtimes/search')
      .send({ movieId })
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].movieId).toBe(movieId);
  });

  it('should filter by dateFrom and dateTo', async () => {
    await showtimeRepository.save([
      {
        movieId,
        roomId,
        startTime: new Date('2026-04-01T20:00:00Z'),
        ticketPrice: 9.99
      },
      {
        movieId,
        roomId,
        startTime: new Date('2026-05-01T20:00:00Z'),
        ticketPrice: 9.99
      }
    ]);

    const res = await request(app.getHttpServer())
      .post('/showtimes/search')
      .send({
        dateFrom: '2026-04-01T00:00:00Z',
        dateTo: '2026-04-30T23:59:59Z'
      })
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(new Date(res.body[0].startTime).getMonth()).toBe(3);
  });

  it('should return empty array when no showtimes match', async () => {
    const res = await request(app.getHttpServer())
      .post('/showtimes/search')
      .send({ movieId: 99999 })
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should return 400 on invalid filter values', async () => {
    await request(app.getHttpServer())
      .post('/showtimes/search')
      .send({ movieId: 'not-a-number' })
      .expect(400);
  });

  it('should be public (no auth required)', async () => {
    await request(app.getHttpServer())
      .post('/showtimes/search')
      .send({})
      .expect(200);
  });
});

describe('GET /showtimes/:id', () => {
  let app: INestApplication;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = showtimeRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
  });

  it('should return 200 with showtime, movie and room details', async () => {
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
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId: cinema.id
    });
    const showtime = await showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2026-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });

    const res = await request(app.getHttpServer())
      .get(`/showtimes/${showtime.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.id).toBe(showtime.id);
    expect(res.body.movie).toBeDefined();
    expect(res.body.movie.id).toBe(movie.id);
    expect(res.body.room).toBeDefined();
    expect(res.body.room.id).toBe(room.id);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer()).get('/showtimes/1').expect(401);
  });

  it('should return 404 when showtime does not exist', async () => {
    await request(app.getHttpServer())
      .get('/showtimes/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

describe('POST /showtimes', () => {
  let app: INestApplication;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let movieId: number;
  let roomId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = showtimeRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);

    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;

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
    movieId = movie.id;

    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    const room = await roomRepository.save({
      name: 'Sala 1',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId: cinema.id
    });
    roomId = room.id;
  });

  it('should return 201 when created by ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .post('/showtimes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId,
        roomId,
        startTime: '2026-04-01T20:00:00Z',
        ticketPrice: 9.99
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.movieId).toBe(movieId);
    expect(res.body.roomId).toBe(roomId);
  });

  it('should return 400 on validation failure', async () => {
    await request(app.getHttpServer())
      .post('/showtimes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ movieId, roomId })
      .expect(400);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .post('/showtimes')
      .send({
        movieId,
        roomId,
        startTime: '2026-04-01T20:00:00Z',
        ticketPrice: 9.99
      })
      .expect(401);
  });

  it('should return 403 when user is not ADMIN or cinema owner', async () => {
    await request(app.getHttpServer())
      .post('/showtimes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        movieId,
        roomId,
        startTime: '2026-04-01T20:00:00Z',
        ticketPrice: 9.99
      })
      .expect(403);
  });

  it('should return 404 when movie does not exist', async () => {
    await request(app.getHttpServer())
      .post('/showtimes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: 99999,
        roomId,
        startTime: '2026-04-01T20:00:00Z',
        ticketPrice: 9.99
      })
      .expect(404);
  });

  it('should return 404 when room does not exist', async () => {
    await request(app.getHttpServer())
      .post('/showtimes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId,
        roomId: 99999,
        startTime: '2026-04-01T20:00:00Z',
        ticketPrice: 9.99
      })
      .expect(404);
  });
});

describe('PATCH /showtimes/:id', () => {
  let app: INestApplication;
  let showtimeRepository: Repository<Showtime>;
  let movieRepository: Repository<Movie>;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    showtimeRepository = testModule.get<Repository<Showtime>>(
      getRepositoryToken(Showtime)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = showtimeRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'showtimes',
      'rooms',
      'cinemas',
      'movies',
      'users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
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
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId: cinema.id
    });
    return showtimeRepository.save({
      movieId: movie.id,
      roomId: room.id,
      startTime: new Date('2026-04-01T20:00:00Z'),
      ticketPrice: 9.99
    });
  }

  it('should return 200 with updated showtime when ADMIN', async () => {
    const showtime = await createShowtime();

    const res = await request(app.getHttpServer())
      .patch(`/showtimes/${showtime.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketPrice: 12.5 })
      .expect(200);

    expect(res.body.ticketPrice).toBe(12.5);
  });

  it('should return 400 on empty body', async () => {
    const showtime = await createShowtime();

    await request(app.getHttpServer())
      .patch(`/showtimes/${showtime.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);
  });

  it('should return 401 when not authenticated', async () => {
    await request(app.getHttpServer())
      .patch('/showtimes/1')
      .send({ ticketPrice: 12.5 })
      .expect(401);
  });

  it('should return 403 when user is not ADMIN or cinema owner', async () => {
    const showtime = await createShowtime();

    await request(app.getHttpServer())
      .patch(`/showtimes/${showtime.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ticketPrice: 12.5 })
      .expect(403);
  });

  it('should return 404 when showtime does not exist', async () => {
    await request(app.getHttpServer())
      .patch('/showtimes/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ticketPrice: 12.5 })
      .expect(404);
  });
});
