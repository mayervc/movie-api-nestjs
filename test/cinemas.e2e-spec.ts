import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';

describe('CinemasController (e2e)', () => {
  let app: INestApplication;
  let cinemaRepository: Repository<Cinema>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    dataSource = cinemaRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['cinemas']);
  });

  describe('GET /cinemas', () => {
    it('should return cinemas with pagination', async () => {
      await cinemaRepository.save([
        { name: 'Cinema One' },
        { name: 'Cinema Two' }
      ]);

      const response = await request(app.getHttpServer())
        .get('/cinemas?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.totalPages).toBe(1);
    });

    it('should return empty data when no cinemas exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/cinemas?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });
});

