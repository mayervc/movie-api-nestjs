import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUserAndOther } from './test-auth.helper';

describe('Users (e2e) - GET /users/me, POST /users/admin, POST /users/vendors, PATCH /users/:id', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let userToken: string;
  let adminToken: string;
  let userId: number;
  let otherUserId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    userRepository = testModule.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await truncateTables(userRepository.manager.connection, ['users']);
    const auth = await createAdminAndUserAndOther(userRepository, app);
    adminToken = auth.adminToken;
    userToken = auth.userToken;
    userId = auth.regularUser.id;
    otherUserId = auth.otherUser.id;
  });

  describe('GET /users/me', () => {
    it('should return current user when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer ' + userToken)
        .expect(200);
      expect(res.body.email).toBe('user@test.com');
      expect(res.body.role).toBe(UserRole.USER);
      expect(res.body.password).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('POST /users/admin', () => {
    const validBody = {
      email: 'newadmin@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Admin'
    };

    it('should create admin user when called by ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', 'Bearer ' + adminToken)
        .send(validBody)
        .expect(201);
      expect(res.body.email).toBe(validBody.email);
      expect(res.body.role).toBe(UserRole.ADMIN);
      expect(res.body.password).toBeUndefined();
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', 'Bearer ' + userToken)
        .send(validBody)
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/users/admin')
        .send(validBody)
        .expect(401);
    });

    it('should return 409 when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ ...validBody, email: 'admin@test.com' })
        .expect(409);
    });

    it('should return 400 when validation fails', async () => {
      await request(app.getHttpServer())
        .post('/users/admin')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ email: 'invalid', password: 'short' })
        .expect(400);
    });
  });

  describe('POST /users/vendors', () => {
    const validBody = {
      email: 'newvendor@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Vendor'
    };

    it('should create vendor user when called by ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/vendors')
        .set('Authorization', 'Bearer ' + adminToken)
        .send(validBody)
        .expect(201);
      expect(res.body.email).toBe(validBody.email);
      expect(res.body.role).toBe(UserRole.VENDOR);
      expect(res.body.password).toBeUndefined();
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/users/vendors')
        .set('Authorization', 'Bearer ' + userToken)
        .send(validBody)
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/users/vendors')
        .send(validBody)
        .expect(401);
    });

    it('should return 409 when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/users/vendors')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ ...validBody, email: 'admin@test.com' })
        .expect(409);
    });

    it('should return 400 when validation fails', async () => {
      await request(app.getHttpServer())
        .post('/users/vendors')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ email: 'invalid', password: 'short' })
        .expect(400);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user when called by resource owner', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ firstName: 'Updated', lastName: 'Name' })
        .expect(200);
      expect(res.body.firstName).toBe('Updated');
      expect(res.body.lastName).toBe('Name');
      expect(res.body.email).toBe('user@test.com');
      expect(res.body.password).toBeUndefined();
    });

    it('should update user when called by ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ email: 'updated@test.com' })
        .expect(200);
      expect(res.body.email).toBe('updated@test.com');
    });

    it('should return 403 when non-owner non-ADMIN updates another user', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${otherUserId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ firstName: 'Hacked' })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ firstName: 'Updated' })
        .expect(401);
    });

    it('should return 404 when user does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/users/99999')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ firstName: 'Updated' })
        .expect(404);
    });

    it('should return 409 when new email already exists', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ email: 'admin@test.com' })
        .expect(409);
    });

    it('should return 400 when validation fails', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });
});
