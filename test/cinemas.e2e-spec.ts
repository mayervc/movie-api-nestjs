import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cinema } from '../src/cinemas/entities/cinema.entity';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

describe('CinemasController (e2e)', () => {
  let app: INestApplication;
  let cinemaRepository: Repository<Cinema>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    cinemaRepository = testModule.get<Repository<Cinema>>(
      getRepositoryToken(Cinema)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = cinemaRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['cinemas', 'users']);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
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

  describe('POST /cinemas', () => {
    it('should create cinema when ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/cinemas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cinema Admin' })
        .expect(201);

      expect(response.body.name).toBe('Cinema Admin');
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/cinemas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Cinema NonAdmin' })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/cinemas')
        .send({ name: 'Cinema Unauthenticated' })
        .expect(401);
    });

    it('should return 400 when validation fails', async () => {
      await request(app.getHttpServer())
        .post('/cinemas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });
});

