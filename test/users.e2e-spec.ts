import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import * as bcrypt from 'bcrypt';

describe('Users (e2e) - GET /users/me, POST /users/admin', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    userRepository = testModule.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await userRepository.query('TRUNCATE TABLE "users" CASCADE');

    const userPassword = await bcrypt.hash('User123!', 10);
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    await userRepository.save(
      userRepository.create({
        email: 'user@test.com',
        password: userPassword,
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.USER
      })
    );
    await userRepository.save(
      userRepository.create({
        email: 'admin@test.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN
      })
    );

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'User123!' });
    userToken = userLogin.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123!' });
    adminToken = adminLogin.body.access_token;
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
});
