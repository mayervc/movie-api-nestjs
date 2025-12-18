import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    // Crear la aplicación de test (se reutiliza si ya existe)
    // AppModule ya incluye UsersModule y AuthModule
    app = await createTestApp();

    // Obtener UserRepository para los tests
    const testModule = getTestModule();
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    // Limpiar usuarios antes de cada test
    if (userRepository) {
      try {
        await userRepository.query('TRUNCATE TABLE "users" CASCADE');
      } catch (error) {
        // Ignorar errores si la tabla no existe o ya está vacía
        console.warn('Error cleaning users:', error.message);
      }
    }
  });

  describe('POST /auth/login', () => {
    it('should return 200 with token for valid credentials', async () => {
      // Arrange: Crear un usuario de prueba
      const userPassword = 'password123';
      const hashedPassword = await bcrypt.hash(userPassword, 10);

      const testUser = userRepository.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User'
      });
      await userRepository.save(testUser);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: userPassword
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body.access_token).toBeDefined();
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return 401 for non-existent user', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      // Arrange: Crear un usuario de prueba
      const correctPassword = 'password123';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);

      const testUser = userRepository.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User'
      });
      await userRepository.save(testUser);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate request body', async () => {
      // Test: Email inválido
      const responseInvalidEmail = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(responseInvalidEmail.status).toBe(400);
      expect(responseInvalidEmail.body.message).toBeDefined();

      // Test: Password muy corto
      const responseShortPassword = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: '12345' // Menos de 6 caracteres
        });

      expect(responseShortPassword.status).toBe(400);
      expect(responseShortPassword.body.message).toBeDefined();

      // Test: Campos faltantes
      const responseMissingFields = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com'
          // password faltante
        });

      expect(responseMissingFields.status).toBe(400);
      expect(responseMissingFields.body.message).toBeDefined();
    });
  });
});
