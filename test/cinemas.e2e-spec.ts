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
  let adminUserId: number;
  let regularUserId: number;

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

    // STR-250: ensure join table exists for this endpoint PR (DB migration is separated)
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "cinema_users" (
        "id" SERIAL PRIMARY KEY,
        "cinema_id" integer NOT NULL REFERENCES "cinemas"("id") ON DELETE CASCADE,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" timestamp default now() NOT NULL,
        UNIQUE ("cinema_id", "user_id")
      );
    `);

    await dataSource.query(`TRUNCATE TABLE "cinema_users" CASCADE`);
    const auth = await createAdminAndUser(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    adminUserId = auth.adminUser.id;
    regularUserId = auth.regularUser.id;
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

  describe('GET /cinemas/:id', () => {
    it('should return cinema by id (public)', async () => {
      const cinema = await cinemaRepository.save({
        name: 'Single Cinema',
        address: 'Main St 1',
        city: 'La Paz',
        country: 'Bolivia',
        phoneNumber: '70000000',
        countryCode: '+591'
      });

      const res = await request(app.getHttpServer())
        .get(`/cinemas/${cinema.id}`)
        .expect(200);

      expect(res.body.id).toBe(cinema.id);
      expect(res.body.name).toBe('Single Cinema');
      expect(res.body.address).toBe('Main St 1');
      expect(res.body.city).toBe('La Paz');
    });

    it('should return 404 when cinema does not exist', async () => {
      await request(app.getHttpServer()).get('/cinemas/99999').expect(404);
    });

    it('should be public (no auth required)', async () => {
      const cinema = await cinemaRepository.save({ name: 'Public Cinema' });

      const res = await request(app.getHttpServer())
        .get(`/cinemas/${cinema.id}`)
        .expect(200);

      expect(res.body.name).toBe('Public Cinema');
    });
  });

  describe('GET /cinemas/search', () => {
    it('should return 200 with matching cinemas when q matches name', async () => {
      await cinemaRepository.save([
        { name: 'Cinema Plaza Norte' },
        { name: 'Cinema Central' }
      ]);

      const res = await request(app.getHttpServer())
        .get('/cinemas/search')
        .query({ q: 'Plaza', page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Cinema Plaza Norte');
      expect(res.body.total).toBe(1);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
      expect(res.body.totalPages).toBe(1);
    });

    it('should match city and country (case-insensitive)', async () => {
      await cinemaRepository.save([
        { name: 'A', city: 'La Paz', country: 'Bolivia' },
        { name: 'B', city: 'Santa Cruz', country: 'Bolivia' }
      ]);

      const res = await request(app.getHttpServer())
        .get('/cinemas/search')
        .query({ q: 'la paz', page: 1, limit: 10 })
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('A');
    });

    it('should return all cinemas paginated when q is empty', async () => {
      await cinemaRepository.save([{ name: 'One' }, { name: 'Two' }]);

      const res = await request(app.getHttpServer())
        .get('/cinemas/search?page=1&limit=10')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should return 400 when page is less than 1', async () => {
      await request(app.getHttpServer())
        .get('/cinemas/search')
        .query({ q: 'x', page: 0, limit: 10 })
        .expect(400);
    });

    it('should return 400 when limit is less than 1', async () => {
      await request(app.getHttpServer())
        .get('/cinemas/search')
        .query({ q: 'x', page: 1, limit: 0 })
        .expect(400);
    });

    it('should return 400 when page is not a number', async () => {
      await request(app.getHttpServer())
        .get('/cinemas/search')
        .query({ q: 'x', page: 'abc', limit: 10 })
        .expect(400);
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

  describe('PATCH /cinemas/:id', () => {
    it('should update cinema when ADMIN', async () => {
      const cinema = await cinemaRepository.save({
        name: 'Cinema ToUpdate',
        address: 'Old address'
      });

      const res = await request(app.getHttpServer())
        .patch(`/cinemas/${cinema.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: 'New address' })
        .expect(200);

      expect(res.body.id).toBe(cinema.id);
      expect(res.body.address).toBe('New address');
    });

    it('should return 403 when called by non-ADMIN', async () => {
      const cinema = await cinemaRepository.save({
        name: 'Cinema NonAdminUpdate'
      });

      await request(app.getHttpServer())
        .patch(`/cinemas/${cinema.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ address: 'Hacked address' })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      const cinema = await cinemaRepository.save({
        name: 'Cinema UnauthenticatedUpdate'
      });

      await request(app.getHttpServer())
        .patch(`/cinemas/${cinema.id}`)
        .send({ address: 'New address' })
        .expect(401);
    });

    it('should return 404 when cinema does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/cinemas/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: 'New address' })
        .expect(404);
    });

    it('should return 400 when validation fails', async () => {
      const cinema = await cinemaRepository.save({
        name: 'Cinema Validation'
      });

      await request(app.getHttpServer())
        .patch(`/cinemas/${cinema.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('POST /cinemas/:id/users', () => {
    it('should link user to cinema when ADMIN', async () => {
      const cinema = await cinemaRepository.save({ name: 'Cinema Link Users' });

      const response = await request(app.getHttpServer())
        .post(`/cinemas/${cinema.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: regularUserId })
        .expect(201);

      expect(response.body.cinemaId).toBe(cinema.id);
      expect(response.body.userId).toBe(regularUserId);

      const rows = await dataSource.query(
        `SELECT id FROM "cinema_users" WHERE "cinema_id" = $1 AND "user_id" = $2`,
        [cinema.id, regularUserId]
      );
      expect(rows).toHaveLength(1);
    });

    it('should return 403 when called by non-ADMIN', async () => {
      const cinema = await cinemaRepository.save({ name: 'Cinema NonAdmin Link' });

      await request(app.getHttpServer())
        .post(`/cinemas/${cinema.id}/users`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId: regularUserId })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      const cinema = await cinemaRepository.save({ name: 'Cinema NoAuth Link' });

      await request(app.getHttpServer())
        .post(`/cinemas/${cinema.id}/users`)
        .send({ userId: regularUserId })
        .expect(401);
    });

    it('should return 404 when cinema does not exist', async () => {
      await request(app.getHttpServer())
        .post('/cinemas/99999/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: regularUserId })
        .expect(404);
    });

    it('should return 400 when validation fails', async () => {
      const cinema = await cinemaRepository.save({ name: 'Cinema Validation Link' });

      await request(app.getHttpServer())
        .post(`/cinemas/${cinema.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 0 })
        .expect(400);
    });
  });
});

