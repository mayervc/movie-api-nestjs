import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';

/** Credenciales de test usadas en E2E */
export const TEST_CREDENTIALS = {
  admin: { email: 'admin@test.com', password: 'Admin123!' },
  user: { email: 'user@test.com', password: 'User123!' },
  other: { email: 'other@test.com', password: 'Other123!' }
} as const;

/**
 * Crea admin y user, hace login y retorna usuarios + tokens.
 */
export async function createAdminAndUser(
  userRepository: Repository<User>,
  app: INestApplication
): Promise<{
  adminUser: User;
  regularUser: User;
  adminToken: string;
  userToken: string;
}> {
  const adminPassword = await bcrypt.hash(TEST_CREDENTIALS.admin.password, 10);
  const userPassword = await bcrypt.hash(TEST_CREDENTIALS.user.password, 10);

  const adminUser = await userRepository.save(
    userRepository.create({
      email: TEST_CREDENTIALS.admin.email,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN
    })
  );

  const regularUser = await userRepository.save(
    userRepository.create({
      email: TEST_CREDENTIALS.user.email,
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER
    })
  );

  const adminLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send(TEST_CREDENTIALS.admin);
  const userLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send(TEST_CREDENTIALS.user);

  return {
    adminUser,
    regularUser,
    adminToken: adminLogin.body.access_token,
    userToken: userLogin.body.access_token
  };
}

/**
 * Crea solo admin y retorna usuario + token.
 */
export async function createAdminOnly(
  userRepository: Repository<User>,
  app: INestApplication
): Promise<{ adminUser: User; adminToken: string }> {
  const adminPassword = await bcrypt.hash(TEST_CREDENTIALS.admin.password, 10);

  const adminUser = await userRepository.save(
    userRepository.create({
      email: TEST_CREDENTIALS.admin.email,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN
    })
  );

  const adminLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send(TEST_CREDENTIALS.admin);

  return {
    adminUser,
    adminToken: adminLogin.body.access_token
  };
}

/**
 * Crea admin, user y other; retorna usuarios + tokens.
 * Para tests que necesitan un tercer usuario (ej: PATCH /users/:id con otro owner).
 */
export async function createAdminAndUserAndOther(
  userRepository: Repository<User>,
  app: INestApplication
): Promise<{
  adminUser: User;
  regularUser: User;
  otherUser: User;
  adminToken: string;
  userToken: string;
}> {
  const adminPassword = await bcrypt.hash(TEST_CREDENTIALS.admin.password, 10);
  const userPassword = await bcrypt.hash(TEST_CREDENTIALS.user.password, 10);
  const otherPassword = await bcrypt.hash(TEST_CREDENTIALS.other.password, 10);

  const adminUser = await userRepository.save(
    userRepository.create({
      email: TEST_CREDENTIALS.admin.email,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN
    })
  );

  const regularUser = await userRepository.save(
    userRepository.create({
      email: TEST_CREDENTIALS.user.email,
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER
    })
  );

  const otherUser = await userRepository.save(
    userRepository.create({
      email: TEST_CREDENTIALS.other.email,
      password: otherPassword,
      firstName: 'Other',
      lastName: 'User',
      role: UserRole.USER
    })
  );

  const adminLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send(TEST_CREDENTIALS.admin);
  const userLogin = await request(app.getHttpServer())
    .post('/auth/login')
    .send(TEST_CREDENTIALS.user);

  return {
    adminUser,
    regularUser,
    otherUser,
    adminToken: adminLogin.body.access_token,
    userToken: userLogin.body.access_token
  };
}
