import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  beforeAll(async () => {
    jest.setTimeout(30000); // Aumentar timeout para inicialización de BD
    // Configurar variables de entorno para tests E2E con base de datos separada
    process.env.DB_DATABASE = 'movie_db_test';
    process.env.DB_TEST_PORT = '5436'; // Puerto del servicio postgres-test
    process.env.NODE_ENV = 'test';

    // Limpiar completamente la base de datos antes de sincronizar
    const tempDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_TEST_PORT || '5436'),
      username: process.env.DB_USERNAME || 'stremio',
      password: process.env.DB_PASSWORD || 'stremio_pass',
      database: 'movie_db_test'
    });

    await tempDataSource.initialize();
    try {
      await tempDataSource.query('DROP SCHEMA public CASCADE');
      await tempDataSource.query('CREATE SCHEMA public');
      await tempDataSource.query('GRANT ALL ON SCHEMA public TO stremio');
      await tempDataSource.query('GRANT ALL ON SCHEMA public TO public');
    } catch (error) {
      // Ignorar errores si el esquema ya no existe
      console.warn('Error cleaning schema:', error.message);
    }
    await tempDataSource.destroy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env'
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_TEST_PORT', 5436), // Puerto del servicio postgres-test
            username: configService.get('DB_USERNAME', 'stremio'),
            password: configService.get('DB_PASSWORD', 'stremio_pass'),
            database: 'movie_db_test', // Base de datos separada para tests
            entities: [User], // Solo la entidad User necesaria para los tests de autenticación
            synchronize: true, // Usar synchronize para tests (crea tablas automáticamente)
            dropSchema: true, // Eliminar esquema antes de sincronizar (limpia la BD de test)
            migrationsRun: false, // No ejecutar migraciones en tests
            logging: false
          }),
          inject: [ConfigService]
        }),
        UsersModule,
        AuthModule
      ]
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar el mismo ValidationPipe que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );

    await app.init();

    // Obtener UserRepository y DataSource para limpiar la base de datos
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User)
    );
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Limpiar base de datos después de todos los tests
    if (app) {
      await app.close();
    }
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
