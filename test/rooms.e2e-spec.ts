import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room } from '../src/rooms/entities/room.entity';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';

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
    await truncateTables(dataSource, ['rooms', 'cinemas']);
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
