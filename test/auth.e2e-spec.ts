import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    // La aplicación de test se crea después de que el setup global complete
    // El setup global ya garantiza que las tablas estén disponibles
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
        // Ignorar errores si la tabla no existe o ya está vacía
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

  describe('POST /auth/signup', () => {
    it('should return 201 with user and token for valid data', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.firstName).toBe('New');
      expect(response.body.user.lastName).toBe('User');
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');

      // Verificar que el usuario se guardó en la base de datos
      const savedUser = await userRepository.findOne({
        where: { email: 'newuser@example.com' }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe('newuser@example.com');
      expect(savedUser.password).not.toBe('Password123!'); // Debe estar hasheado
    });

    it('should return 400 for invalid email', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(
        response.body.message.some((msg: string) =>
          msg.toLowerCase().includes('email')
        )
      ).toBe(true);
    });

    it('should return 400 for weak password', async () => {
      // Act - Password muy corto
      const responseShortPassword = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: '12345', // Menos de 6 caracteres
          firstName: 'Test',
          lastName: 'User'
        });

      // Assert
      expect(responseShortPassword.status).toBe(400);
      expect(responseShortPassword.body.message).toBeDefined();
      expect(Array.isArray(responseShortPassword.body.message)).toBe(true);
      expect(
        responseShortPassword.body.message.some(
          (msg: string) =>
            msg.toLowerCase().includes('password') ||
            msg.toLowerCase().includes('6')
        )
      ).toBe(true);
    });

    it('should return 409 when email already exists', async () => {
      // Arrange: Crear un usuario primero
      const existingEmail = 'existing@example.com';
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const existingUser = userRepository.create({
        email: existingEmail,
        password: hashedPassword,
        firstName: 'Existing',
        lastName: 'User'
      });
      await userRepository.save(existingUser);

      // Act: Intentar crear otro usuario con el mismo email
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: existingEmail,
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User'
        });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should return 400 for missing required fields', async () => {
      // Test: Email faltante
      const responseNoEmail = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(responseNoEmail.status).toBe(400);
      expect(responseNoEmail.body.message).toBeDefined();

      // Test: Password faltante
      const responseNoPassword = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(responseNoPassword.status).toBe(400);
      expect(responseNoPassword.body.message).toBeDefined();
    });

    it('should hash password before storing', async () => {
      // Act
      const plainPassword = 'Password123!';
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'hashtest@example.com',
          password: plainPassword,
          firstName: 'Hash',
          lastName: 'Test'
        });

      // Assert
      expect(response.status).toBe(201);

      // Verificar que el password está hasheado en la BD
      const savedUser = await userRepository.findOne({
        where: { email: 'hashtest@example.com' }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d{2}\$/); // Formato bcrypt

      // Verificar que el password hasheado funciona
      const isValidPassword = await bcrypt.compare(
        plainPassword,
        savedUser.password
      );
      expect(isValidPassword).toBe(true);
    });

    it('should work with optional firstName and lastName', async () => {
      // Act - Sin firstName y lastName
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'optional@example.com',
          password: 'Password123!'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('optional@example.com');
      expect(response.body.user.firstName).toBeFalsy(); // Puede ser null o undefined
      expect(response.body.user.lastName).toBeFalsy(); // Puede ser null o undefined
    });

    it('should assign USER role by default to new users', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'rolecheck@example.com',
          password: 'Password123!',
          firstName: 'Role',
          lastName: 'Check'
        });

      // Assert
      expect(response.status).toBe(201);

      // Verificar que el usuario tiene rol USER en la base de datos
      const savedUser = await userRepository.findOne({
        where: { email: 'rolecheck@example.com' }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser.role).toBe(UserRole.USER);
    });
  });
});
