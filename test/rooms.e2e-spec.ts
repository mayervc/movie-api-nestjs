import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room } from '../src/rooms/entities/room.entity';
import { RoomBlock } from '../src/rooms/entities/room-block.entity';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { CinemaUser } from '../src/cinemas/entities/cinema-user.entity';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

describe('GET /rooms/:id', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let dataSource: DataSource;
  let cinemaId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    dataSource = roomRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'rooms',
      'cinemas',
      'users',
      'cinema_users'
    ]);
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    cinemaId = cinema.id;
  });

  it('should return 200 with room data', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    const res = await request(app.getHttpServer())
      .get(`/rooms/${room.id}`)
      .expect(200);

    expect(res.body.id).toBe(room.id);
    expect(res.body.name).toBe('Sala Estandar');
    expect(res.body.rowsBlocks).toBe(2);
    expect(res.body.columnsBlocks).toBe(2);
    expect(res.body.cinemaId).toBe(cinemaId);
  });

  it('should return 404 when room does not exist', async () => {
    await request(app.getHttpServer()).get('/rooms/99999').expect(404);
  });

  it('should be public (no auth required)', async () => {
    const room = await roomRepository.save({
      name: 'Sala VIP',
      rowsBlocks: 1,
      columnsBlocks: 2,
      details: 'VIP room',
      cinemaId
    });

    const res = await request(app.getHttpServer())
      .get(`/rooms/${room.id}`)
      .expect(200);

    expect(res.body.name).toBe('Sala VIP');
    expect(res.body.details).toBe('VIP room');
  });
});

describe('PATCH /rooms/:id', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let cinemaUserRepository: Repository<CinemaUser>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let regularUserId: number;
  let cinemaId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    cinemaUserRepository = testModule.get<Repository<CinemaUser>>(
      getRepositoryToken(CinemaUser)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = roomRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'rooms',
      'cinemas',
      'users',
      'cinema_users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    regularUserId = auth.regularUser.id;
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    cinemaId = cinema.id;
  });

  it('should return 200 with updated room when called by ADMIN', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    const res = await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sala VIP' })
      .expect(200);

    expect(res.body.id).toBe(room.id);
    expect(res.body.name).toBe('Sala VIP');
    expect(res.body.rowsBlocks).toBe(2);
  });

  it('should return 200 with updated room when called by cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    await cinemaUserRepository.save(
      cinemaUserRepository.create({ cinemaId, userId: regularUserId })
    );

    const res = await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ details: 'Updated details' })
      .expect(200);

    expect(res.body.details).toBe('Updated details');
  });

  it('should return 403 when user is not ADMIN or cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Sala VIP' })
      .expect(403);
  });

  it('should return 401 when not authenticated', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .send({ name: 'Sala VIP' })
      .expect(401);
  });

  it('should return 404 when room does not exist', async () => {
    await request(app.getHttpServer())
      .patch('/rooms/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Sala VIP' })
      .expect(404);
  });

  it('should return 400 when body is empty', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);
  });

  it('should return 400 when validation fails', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .patch(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rowsBlocks: -1 })
      .expect(400);
  });
});

describe('DELETE /rooms/:id', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let cinemaUserRepository: Repository<CinemaUser>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let regularUserId: number;
  let cinemaId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    cinemaUserRepository = testModule.get<Repository<CinemaUser>>(
      getRepositoryToken(CinemaUser)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = roomRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'rooms',
      'cinemas',
      'users',
      'cinema_users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    regularUserId = auth.regularUser.id;
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    cinemaId = cinema.id;
  });

  it('should return 204 when called by ADMIN', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const deleted = await roomRepository.findOne({ where: { id: room.id } });
    expect(deleted).toBeNull();
  });

  it('should return 204 when called by cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    await cinemaUserRepository.save(
      cinemaUserRepository.create({ cinemaId, userId: regularUserId })
    );

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    const deleted = await roomRepository.findOne({ where: { id: room.id } });
    expect(deleted).toBeNull();
  });

  it('should return 403 when user is not ADMIN or cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .delete(`/rooms/${room.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should return 401 when not authenticated', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer()).delete(`/rooms/${room.id}`).expect(401);
  });

  it('should return 404 when room does not exist', async () => {
    await request(app.getHttpServer())
      .delete('/rooms/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});

describe('POST /rooms/:roomId/blocks', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let cinemaRepository: Repository<Cinema>;
  let cinemaUserRepository: Repository<CinemaUser>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let regularUserId: number;
  let cinemaId: number;

  const validPayload = {
    rowSeats: 5,
    columnsSeats: 8,
    blockRow: 1,
    blockColumn: 1
  };

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    cinemaUserRepository = testModule.get<Repository<CinemaUser>>(
      getRepositoryToken(CinemaUser)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = roomRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'room_blocks',
      'rooms',
      'cinemas',
      'users',
      'cinema_users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    regularUserId = auth.regularUser.id;
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    cinemaId = cinema.id;
  });

  it('should return 201 with created block when called by ADMIN', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    const res = await request(app.getHttpServer())
      .post(`/rooms/${room.id}/blocks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.rowSeats).toBe(5);
    expect(res.body.columnsSeats).toBe(8);
    expect(res.body.blockRow).toBe(1);
    expect(res.body.blockColumn).toBe(1);
    expect(res.body.roomId).toBe(room.id);
  });

  it('should return 201 when called by cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    await cinemaUserRepository.save(
      cinemaUserRepository.create({ cinemaId, userId: regularUserId })
    );

    const res = await request(app.getHttpServer())
      .post(`/rooms/${room.id}/blocks`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPayload)
      .expect(201);

    expect(res.body.roomId).toBe(room.id);
  });

  it('should return 403 when user is not ADMIN or cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/blocks`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPayload)
      .expect(403);
  });

  it('should return 401 when not authenticated', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/blocks`)
      .send(validPayload)
      .expect(401);
  });

  it('should return 404 when room does not exist', async () => {
    await request(app.getHttpServer())
      .post('/rooms/99999/blocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPayload)
      .expect(404);
  });

  it('should return 400 when validation fails', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });

    await request(app.getHttpServer())
      .post(`/rooms/${room.id}/blocks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rowSeats: -1, columnsSeats: 8, blockRow: 1, blockColumn: 1 })
      .expect(400);
  });
});

describe('PATCH /room-blocks/:id', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let roomBlockRepository: Repository<RoomBlock>;
  let cinemaRepository: Repository<Cinema>;
  let cinemaUserRepository: Repository<CinemaUser>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let regularUserId: number;
  let cinemaId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    roomRepository = testModule.get<Repository<Room>>(getRepositoryToken(Room));
    roomBlockRepository = testModule.get<Repository<RoomBlock>>(
      getRepositoryToken(RoomBlock)
    );
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    cinemaUserRepository = testModule.get<Repository<CinemaUser>>(
      getRepositoryToken(CinemaUser)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = roomRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, [
      'room_blocks',
      'rooms',
      'cinemas',
      'users',
      'cinema_users'
    ]);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    regularUserId = auth.regularUser.id;
    const cinema = await cinemaRepository.save({ name: 'Test Cinema' });
    cinemaId = cinema.id;
  });

  it('should return 200 with updated block when called by ADMIN', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    const block = await roomBlockRepository.save({
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });

    const res = await request(app.getHttpServer())
      .patch(`/room-blocks/${block.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rowSeats: 10 })
      .expect(200);

    expect(res.body.id).toBe(block.id);
    expect(res.body.rowSeats).toBe(10);
    expect(res.body.columnsSeats).toBe(8);
  });

  it('should return 200 with updated block when called by cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    const block = await roomBlockRepository.save({
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });
    await cinemaUserRepository.save(
      cinemaUserRepository.create({ cinemaId, userId: regularUserId })
    );

    const res = await request(app.getHttpServer())
      .patch(`/room-blocks/${block.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ columnsSeats: 12 })
      .expect(200);

    expect(res.body.columnsSeats).toBe(12);
  });

  it('should return 403 when user is not ADMIN or cinema owner', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    const block = await roomBlockRepository.save({
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });

    await request(app.getHttpServer())
      .patch(`/room-blocks/${block.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rowSeats: 10 })
      .expect(403);
  });

  it('should return 401 when not authenticated', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    const block = await roomBlockRepository.save({
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });

    await request(app.getHttpServer())
      .patch(`/room-blocks/${block.id}`)
      .send({ rowSeats: 10 })
      .expect(401);
  });

  it('should return 404 when block does not exist', async () => {
    await request(app.getHttpServer())
      .patch('/room-blocks/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rowSeats: 10 })
      .expect(404);
  });

  it('should return 400 when body is empty', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    const block = await roomBlockRepository.save({
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });

    await request(app.getHttpServer())
      .patch(`/room-blocks/${block.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);
  });

  it('should return 400 when validation fails', async () => {
    const room = await roomRepository.save({
      name: 'Sala Estandar',
      rowsBlocks: 2,
      columnsBlocks: 2,
      details: null,
      cinemaId
    });
    const block = await roomBlockRepository.save({
      rowSeats: 5,
      columnsSeats: 8,
      blockRow: 1,
      blockColumn: 1,
      roomId: room.id
    });

    await request(app.getHttpServer())
      .patch(`/room-blocks/${block.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rowSeats: -1 })
      .expect(400);
  });
});
