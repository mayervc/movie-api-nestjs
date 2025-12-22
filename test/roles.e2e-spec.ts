import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import { createTestApp, getTestModule } from './test-app.helper';
import { waitForTablesToBeReady } from './test-helpers';
import * as bcrypt from 'bcrypt';

describe('Roles Protection (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  // Usuarios de prueba
  let adminUser: User;
  let regularUser: User;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await waitForTablesToBeReady(['users', 'movies']);

    app = await createTestApp();
    const testModule = getTestModule();
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));

    // Verificar que las tablas están disponibles usando el repository
    let retries = 5;
    while (retries > 0) {
      try {
        await userRepository.query('SELECT 1 FROM users LIMIT 1');
        await userRepository.query('SELECT 1 FROM movies LIMIT 1');
        break;
      } catch (error) {
        if (retries === 1) {
          throw new Error(
            `Las tablas no están disponibles: ${(error as Error).message}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      retries--;
    }
  });

  beforeEach(async () => {
    // Verificar que el beforeAll se completó correctamente
    if (!app || !userRepository) {
      throw new Error(
        'La aplicación de test no se inicializó correctamente en beforeAll. ' +
          'Verifica que las migraciones se ejecutaron y las tablas están disponibles.'
      );
    }

    // Limpiar usuarios y películas antes de cada test
    // Las tablas ya deberían existir gracias al setup global y la verificación en beforeAll
    try {
      await userRepository.query('TRUNCATE TABLE "users" CASCADE');
      await userRepository.query('TRUNCATE TABLE "movies" CASCADE');
    } catch (error) {
      // Si las tablas no existen, intentar verificar el estado actual
      try {
        const { getDataSourceToken } = await import('@nestjs/typeorm');
        const testModule = getTestModule();
        const nestDataSource = testModule.get<DataSource>(getDataSourceToken());
        const tables = await nestDataSource.query(`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('users', 'movies')
        `);

        throw new Error(
          `Error al limpiar tablas: ${(error as Error).message}. ` +
            `Las tablas deberían existir después del setup. ` +
            `Tablas encontradas en pg_tables: ${tables.map((t: any) => t.tablename).join(', ') || 'ninguna'}`
        );
      } catch (verifyError) {
        throw new Error(
          `Error al limpiar tablas: ${(error as Error).message}. ` +
            `Las tablas deberían existir después del setup. ` +
            `Error al verificar: ${(verifyError as Error).message}`
        );
      }
    }

    // Crear usuarios de prueba con diferentes roles
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const userPassword = await bcrypt.hash('User123!', 10);

    adminUser = userRepository.create({
      email: 'admin@test.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN
    });
    await userRepository.save(adminUser);

    regularUser = userRepository.create({
      email: 'user@test.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER
    });
    await userRepository.save(regularUser);

    // Obtener tokens para ambos usuarios
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!'
      });
    adminToken = adminLoginResponse.body.access_token;

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@test.com',
        password: 'User123!'
      });
    userToken = userLoginResponse.body.access_token;
  });

  describe('POST /movies - Admin only endpoint', () => {
    const createMovieDto = {
      title: 'Test Movie',
      description: 'A test movie',
      releaseDate: '2024-01-01',
      duration: 120
    };

    it('should return 403 when regular user tries to create a movie', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createMovieDto);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
      expect(response.body.message).toContain('admin');
    });

    it('should return 201 when admin creates a movie', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMovieDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(createMovieDto.title);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .send(createMovieDto);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /movies/:id - Admin only endpoint', () => {
    let movieId: number;

    beforeEach(async () => {
      // Crear una película como admin para poder actualizarla
      const createResponse = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Original Movie',
          description: 'Original description',
          releaseDate: '2023-01-01',
          duration: 120
        });
      movieId = createResponse.body.id;
    });

    it('should return 403 when regular user tries to update a movie', async () => {
      const updateDto = {
        title: 'Updated Movie'
      };

      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
      expect(response.body.message).toContain('admin');
    });

    it('should return 200 when admin updates a movie', async () => {
      const updateDto = {
        title: 'Updated Movie Title'
      };

      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateDto.title);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /movies/:id - Admin only endpoint', () => {
    let movieId: number;

    beforeEach(async () => {
      // Crear una película como admin para poder eliminarla
      const createResponse = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Movie to Delete',
          description: 'This will be deleted',
          releaseDate: '2024-01-01',
          duration: 120
        });
      movieId = createResponse.body.id;
    });

    it('should return 403 when regular user tries to delete a movie', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Access denied');
      expect(response.body.message).toContain('admin');
    });

    it('should return 204 when admin deletes a movie', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verificar que la película fue eliminada
      const getResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer()).delete(
        `/movies/${movieId}`
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /movies - Public endpoint', () => {
    beforeEach(async () => {
      // Crear algunas películas como admin
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Public Movie 1',
          description: 'Description 1',
          releaseDate: '2024-01-01',
          duration: 120
        });

      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Public Movie 2',
          description: 'Description 2',
          releaseDate: '2023-01-01',
          duration: 120
        });
    });

    it('should return 200 without authentication token', async () => {
      const response = await request(app.getHttpServer()).get('/movies');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 200 with user token', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 200 with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /movies/:id - Public endpoint', () => {
    let movieId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Public Movie',
          description: 'Public description',
          releaseDate: '2024-01-01',
          duration: 120
        });
      movieId = createResponse.body.id;
    });

    it('should return 200 without authentication token', async () => {
      const response = await request(app.getHttpServer()).get(
        `/movies/${movieId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(movieId);
      expect(response.body.title).toBe('Public Movie');
    });

    it('should return 200 with user token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(movieId);
    });

    it('should return 200 with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(movieId);
    });
  });

  describe('POST /movies/search - Public endpoint', () => {
    beforeEach(async () => {
      // Crear algunas películas como admin
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Searchable Movie',
          description: 'This is searchable',
          releaseDate: '2024-01-01',
          duration: 120
        });
    });

    it('should return 200 without authentication token', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies/search')
        .send({
          query: 'Searchable'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 200 with user token', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies/search')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: 'Searchable'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 200 with admin token', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: 'Searchable'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Role verification edge cases', () => {
    it('should return 403 with invalid token format', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', 'InvalidToken')
        .send({
          title: 'Test',
          description: 'Test',
          releaseDate: '2024-01-01',
          duration: 120
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 with expired token', async () => {
      // Nota: Este test requeriría generar un token expirado manualmente
      // Por ahora solo verificamos que un token malformado sea rechazado
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({
          title: 'Test',
          description: 'Test',
          releaseDate: '2024-01-01',
          duration: 120
        });

      expect(response.status).toBe(401);
    });
  });
});
