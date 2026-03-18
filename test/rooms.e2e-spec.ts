import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room } from '../src/rooms/entities/room.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';

describe('RoomsController (e2e)', () => {
  let app: INestApplication;
  let roomRepository: Repository<Room>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    roomRepository = testModule.get<Repository<Room>>(
      getRepositoryToken(Room)
    );
    dataSource = roomRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['rooms']);
  });

  describe('GET /rooms/:id', () => {
    it('should return a room by ID (public)', async () => {
      const created = await roomRepository.save({ name: 'Room 1' });

      const response = await request(app.getHttpServer())
        .get(`/rooms/${created.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.id);
      expect(response.body.name).toBe('Room 1');
    });

    it('should return 404 when room does not exist', async () => {
      await request(app.getHttpServer()).get('/rooms/99999').expect(404);
    });
  });
});

