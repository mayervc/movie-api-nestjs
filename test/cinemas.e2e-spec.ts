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

    it('should return cinemas with new columns (address, city, country, phone, countryCode)', async () => {
      await cinemaRepository.save({
        name: 'Cinema Full',
        address: 'Calle 1',
        city: 'Cochabamba',
        country: 'Bolivia',
        phoneNumber: '123456',
        countryCode: '+591'
      });

      const response = await request(app.getHttpServer())
        .get('/cinemas?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Cinema Full');
      expect(response.body.data[0].address).toBe('Calle 1');
      expect(response.body.data[0].city).toBe('Cochabamba');
      expect(response.body.data[0].country).toBe('Bolivia');
      expect(response.body.data[0].phoneNumber).toBe('123456');
      expect(response.body.data[0].countryCode).toBe('+591');
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

    it('should create cinema with optional columns when ADMIN', async () => {
      const payload = {
        name: 'Cinema With Details',
        address: 'Av. Principal 123',
        city: 'La Paz',
        country: 'Bolivia',
        phoneNumber: '+591 2 1234567',
        countryCode: '+591'
      };
      const response = await request(app.getHttpServer())
        .post('/cinemas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.name).toBe(payload.name);
      expect(response.body.address).toBe(payload.address);
      expect(response.body.city).toBe(payload.city);
      expect(response.body.country).toBe(payload.country);
      expect(response.body.phoneNumber).toBe(payload.phoneNumber);
      expect(response.body.countryCode).toBe(payload.countryCode);
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

