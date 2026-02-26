import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import * as bcrypt from 'bcrypt';

describe('Users (e2e) - GET /users/me', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let userToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    userRepository = testModule.get(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await userRepository.query('TRUNCATE TABLE "users" CASCADE');

    const userPassword = await bcrypt.hash('User123!', 10);
    await userRepository.save(
      userRepository.create({
        email: 'user@test.com',
        password: userPassword,
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.USER
      })
    );

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'User123!' });
    userToken = userLogin.body.access_token;
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
});
