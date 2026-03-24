import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Movie } from '../src/movies/entities/movie.entity';
import { Actor } from '../src/actors/entities/actor.entity';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminAndUser } from './test-auth.helper';

describe('MoviesController (e2e)', () => {
  let app: INestApplication;
  let movieRepository: Repository<Movie>;
  let actorRepository: Repository<Actor>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    actorRepository = testModule.get<Repository<Actor>>(
      getRepositoryToken(Actor)
    );
    userRepository = testModule.get(getRepositoryToken(User));
    dataSource = userRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['movies']);
  });

  describe('GET /movies', () => {
    it('should return all movies (public)', async () => {
      await movieRepository.save([
        {
          title: 'Movie A',
          releaseDate: new Date('2023-01-01'),
          duration: 90
        },
        {
          title: 'Movie B',
          releaseDate: new Date('2023-01-02'),
          duration: 100
        }
      ]);

      const response = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(
        response.body.map((m: { title: string }) => m.title).sort()
      ).toEqual(['Movie A', 'Movie B']);
    });

    it('should return empty array when no movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('POST /movies', () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
      await truncateTables(dataSource, ['users']);
      const auth = await createAdminAndUser(userRepository, app);
      adminToken = auth.adminToken;
      userToken = auth.userToken;
    });

    const validBody = {
      title: 'New Movie',
      releaseDate: '2023-06-15',
      duration: 120
    };

    it('should create movie when called by ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', 'Bearer ' + adminToken)
        .send(validBody)
        .expect(201);

      expect(response.body.title).toBe(validBody.title);
      expect(response.body.duration).toBe(validBody.duration);
      expect(response.body.id).toBeDefined();
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', 'Bearer ' + userToken)
        .send(validBody)
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/movies')
        .send(validBody)
        .expect(401);
    });

    it('should return 400 when validation fails', async () => {
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ title: '', releaseDate: 'invalid', duration: -1 })
        .expect(400);
    });
  });

  describe('PATCH /movies/:id', () => {
    let adminToken: string;
    let userToken: string;
    let movieId: number;

    beforeEach(async () => {
      await truncateTables(dataSource, ['users']);
      const auth = await createAdminAndUser(userRepository, app);
      adminToken = auth.adminToken;
      userToken = auth.userToken;
      const movie = await movieRepository.save({
        title: 'Movie To Update',
        releaseDate: new Date('2023-01-01'),
        duration: 90
      });
      movieId = movie.id;
    });

    it('should update movie when called by ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ title: 'Updated Title', duration: 100 })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.duration).toBe(100);
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('should return 404 when movie does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/movies/99999')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ title: 'Updated' })
        .expect(404);
    });

    it('should return 400 when body is empty', async () => {
      await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /movies/:id', () => {
    let adminToken: string;
    let userToken: string;
    let movieId: number;

    beforeEach(async () => {
      await truncateTables(dataSource, ['users']);
      const auth = await createAdminAndUser(userRepository, app);
      adminToken = auth.adminToken;
      userToken = auth.userToken;
      const movie = await movieRepository.save({
        title: 'Movie To Delete',
        releaseDate: new Date('2023-01-01'),
        duration: 90
      });
      movieId = movie.id;
    });

    it('should delete movie when called by ADMIN', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .expect(204);

      const found = await movieRepository.findOne({ where: { id: movieId } });
      expect(found).toBeNull();
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .expect(403);

      const found = await movieRepository.findOne({ where: { id: movieId } });
      expect(found).not.toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .expect(401);
    });

    it('should return 404 when movie does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/movies/99999')
        .set('Authorization', 'Bearer ' + adminToken)
        .expect(404);
    });
  });

  describe('GET /movies/trending', () => {
    it('should return only trending movies', async () => {
      // Arrange: Crear películas de prueba
      await movieRepository.save([
        {
          title: 'Trending Movie 1',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          trending: true
        },
        {
          title: 'Trending Movie 2',
          releaseDate: new Date('2023-01-02'),
          duration: 100,
          trending: true
        },
        {
          title: 'Trending Movie 3',
          releaseDate: new Date('2023-01-03'),
          duration: 110,
          trending: true
        },
        {
          title: 'Not Trending Movie 1',
          releaseDate: new Date('2023-01-04'),
          duration: 90,
          trending: false
        },
        {
          title: 'Not Trending Movie 2',
          releaseDate: new Date('2023-01-05'),
          duration: 100,
          trending: false
        }
      ]);

      // Act
      const response = await request(app.getHttpServer())
        .get('/movies/trending')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((m: Movie) => m.trending === true)).toBe(
        true
      );
    });

    it('should support pagination', async () => {
      // Arrange: Crear 15 películas trending
      const trendingMovies = Array.from({ length: 15 }, (_, i) => ({
        title: `Trending Movie ${i + 1}`,
        releaseDate: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
        duration: 90 + i,
        trending: true
      }));
      await movieRepository.save(trendingMovies);

      // Act
      const response = await request(app.getHttpServer())
        .get('/movies/trending?page=1&limit=10')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(10);
      expect(response.body.total).toBe(15);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.totalPages).toBe(2);
    });

    it('should work with page 2', async () => {
      // Arrange: Crear 15 películas trending
      const trendingMovies = Array.from({ length: 15 }, (_, i) => ({
        title: `Trending Movie ${i + 1}`,
        releaseDate: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
        duration: 90 + i,
        trending: true
      }));
      await movieRepository.save(trendingMovies);

      // Act
      const response = await request(app.getHttpServer())
        .get('/movies/trending?page=2&limit=10')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(5);
      expect(response.body.page).toBe(2);
      expect(response.body.total).toBe(15);
      expect(response.body.limit).toBe(10);
      expect(response.body.totalPages).toBe(2);
    });

    it('should return empty array if no trending movies', async () => {
      // Arrange: Crear solo películas no trending
      await movieRepository.save([
        {
          title: 'Not Trending Movie 1',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          trending: false
        },
        {
          title: 'Not Trending Movie 2',
          releaseDate: new Date('2023-01-02'),
          duration: 100,
          trending: false
        }
      ]);

      // Act
      const response = await request(app.getHttpServer())
        .get('/movies/trending')
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should use default values (page=1, limit=10)', async () => {
      // Arrange: Crear 5 películas trending
      const trendingMovies = Array.from({ length: 5 }, (_, i) => ({
        title: `Trending Movie ${i + 1}`,
        releaseDate: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
        duration: 90 + i,
        trending: true
      }));
      await movieRepository.save(trendingMovies);

      // Act: Sin query params
      const response = await request(app.getHttpServer())
        .get('/movies/trending')
        .expect(200);

      // Assert
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.data).toHaveLength(5);
    });

    it('should validate invalid parameters', async () => {
      // Test: page negativo
      const responseNegativePage = await request(app.getHttpServer())
        .get('/movies/trending?page=-1')
        .expect(400);

      expect(responseNegativePage.body.message).toBeDefined();

      // Test: limit cero
      const responseZeroLimit = await request(app.getHttpServer())
        .get('/movies/trending?limit=0')
        .expect(400);

      expect(responseZeroLimit.body.message).toBeDefined();

      // Test: limit negativo
      const responseNegativeLimit = await request(app.getHttpServer())
        .get('/movies/trending?limit=-1')
        .expect(400);

      expect(responseNegativeLimit.body.message).toBeDefined();
    });

    it('should be ordered by createdAt DESC', async () => {
      // Arrange: Crear películas con diferentes createdAt usando delays
      // para asegurar que tengan timestamps diferentes
      const movie1 = await movieRepository.save({
        title: 'Trending Movie 1',
        releaseDate: new Date('2023-01-01'),
        duration: 90,
        trending: true
      });

      // Esperar un poco para que tenga un timestamp diferente
      await new Promise((resolve) => setTimeout(resolve, 10));

      await movieRepository.save({
        title: 'Trending Movie 2',
        releaseDate: new Date('2023-01-02'),
        duration: 100,
        trending: true
      });

      // Esperar un poco más
      await new Promise((resolve) => setTimeout(resolve, 10));

      const movie3 = await movieRepository.save({
        title: 'Trending Movie 3',
        releaseDate: new Date('2023-01-03'),
        duration: 110,
        trending: true
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/movies/trending')
        .expect(200);

      // Assert: Verificar que están ordenadas (más reciente primero)
      expect(response.body.data).toHaveLength(3);
      const createdAts = response.body.data.map((m: Movie) =>
        new Date(m.createdAt).getTime()
      );
      const sortedCreatedAts = [...createdAts].sort((a, b) => b - a);
      expect(createdAts).toEqual(sortedCreatedAts);
      // Verificar que la primera película es la más reciente (movie3)
      expect(response.body.data[0].id).toBe(movie3.id);
      // Verificar que la última película es la más antigua (movie1)
      expect(response.body.data[2].id).toBe(movie1.id);
    });

    it('should be a public endpoint (no authentication required)', async () => {
      // Arrange: Crear películas trending
      await movieRepository.save([
        {
          title: 'Trending Movie 1',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          trending: true
        }
      ]);

      // Act: Sin token de autenticación
      const response = await request(app.getHttpServer())
        .get('/movies/trending')
        .expect(200);

      // Assert: Debe retornar 200, no 401
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /movies/popular', () => {
    it('should return popular (trending) movies with pagination', async () => {
      await movieRepository.save([
        {
          title: 'Popular One',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          trending: true
        },
        {
          title: 'Popular Two',
          releaseDate: new Date('2023-01-02'),
          duration: 100,
          trending: true
        }
      ]);

      const response = await request(app.getHttpServer())
        .get('/movies/popular?page=1&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('should return paginated structure and only trending movies', async () => {
      await movieRepository.save([
        {
          title: 'Trending A',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          trending: true
        },
        {
          title: 'Not Trending',
          releaseDate: new Date('2023-01-02'),
          duration: 90,
          trending: false
        }
      ]);

      const response = await request(app.getHttpServer())
        .get('/movies/popular')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number)
      });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Trending A');
    });
  });

  describe('GET /movies/top-rated', () => {
    it('should return movies ordered by rating desc', async () => {
      await movieRepository.save([
        {
          title: 'Low Rated',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          rating: 5.0
        },
        {
          title: 'High Rated',
          releaseDate: new Date('2023-01-02'),
          duration: 100,
          rating: 9.0
        }
      ]);

      const response = await request(app.getHttpServer())
        .get('/movies/top-rated?page=1&limit=10')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data[0].title).toBe('High Rated');
      expect(response.body.data[0].rating).toBe('9.0');
    });

    it('should return paginated structure (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/top-rated')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number)
      });
    });
  });

  describe('GET /movies/:id', () => {
    it('should return a single movie by ID including cast (public)', async () => {
      const created = await movieRepository.save({
        title: 'Single Movie',
        releaseDate: new Date('2023-01-01'),
        duration: 120,
        description: 'A movie'
      });

      const response = await request(app.getHttpServer())
        .get(`/movies/${created.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.id);
      expect(response.body.title).toBe('Single Movie');
      expect(response.body.duration).toBe(120);
      expect(response.body).toHaveProperty('cast');
      expect(Array.isArray(response.body.cast)).toBe(true);
    });

    it('should return 404 when movie does not exist', async () => {
      await request(app.getHttpServer()).get('/movies/99999').expect(404);
    });
  });

  describe('GET /movies/search (query params)', () => {
    it('should search by q and return paginated results', async () => {
      await movieRepository.save({
        title: 'Unique Searchable Title XYZ',
        releaseDate: new Date('2023-01-01'),
        duration: 90,
        description: 'Some description'
      });

      const response = await request(app.getHttpServer())
        .get('/movies/search?q=Unique+Searchable&page=1&limit=10')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      const found = response.body.data.find(
        (m: { title: string }) => m.title === 'Unique Searchable Title XYZ'
      );
      expect(found).toBeDefined();
    });

    it('should return paginated structure with default page and limit when q is empty', async () => {
      await movieRepository.save({
        title: 'Any Movie',
        releaseDate: new Date('2023-01-01'),
        duration: 90
      });

      const response = await request(app.getHttpServer())
        .get('/movies/search?page=1&limit=5')
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 5,
        totalPages: expect.any(Number)
      });
    });
  });

  describe('POST /movies/search', () => {
    it('should search by body query and return paginated results (public)', async () => {
      await movieRepository.save({
        title: 'Body Searchable Movie ABC',
        releaseDate: new Date('2023-01-01'),
        duration: 90,
        description: 'Searchable description'
      });

      const response = await request(app.getHttpServer())
        .post('/movies/search')
        .send({ query: 'Body Searchable', page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number)
      });
      const found = response.body.data.find(
        (m: { title: string }) => m.title === 'Body Searchable Movie ABC'
      );
      expect(found).toBeDefined();
    });

    it('should work without auth (public endpoint)', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies/search')
        .send({ query: 'test', page: 1, limit: 5 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /movies/:id/cast', () => {
    let adminToken: string;
    let userToken: string;
    let movieId: number;
    let actorId: number;

    beforeEach(async () => {
      await truncateTables(dataSource, ['cast', 'movies', 'actors', 'users']);
      const auth = await createAdminAndUser(userRepository, app);
      adminToken = auth.adminToken;
      userToken = auth.userToken;
      const movie = await movieRepository.save({
        title: 'Movie For Cast',
        releaseDate: new Date('2023-01-01'),
        duration: 90
      });
      movieId = movie.id;
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'Test',
          lastName: 'Actor',
          popularity: 80
        })
      );
      actorId = actor.id;
    });

    it('should add actor to cast when called by ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          actorId,
          role: 'Lead',
          characters: ['Character A']
        })
        .expect(201);

      expect(response.body.movieId).toBe(movieId);
      expect(response.body.actorId).toBe(actorId);
      expect(response.body.role).toBe('Lead');
      expect(response.body.characters).toEqual(['Character A']);
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(401);
    });

    it('should return 404 when movie does not exist', async () => {
      await request(app.getHttpServer())
        .post('/movies/99999/cast')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(404);
    });

    it('should return 400 when actor already in cast', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId, role: 'Support', characters: ['B'] })
        .expect(400);
    });
  });

  describe('DELETE /movies/:movieId/actors/:actorId', () => {
    let adminToken: string;
    let userToken: string;
    let movieId: number;
    let actorId: number;

    beforeEach(async () => {
      await truncateTables(dataSource, ['cast', 'movies', 'actors', 'users']);
      const auth = await createAdminAndUser(userRepository, app);
      adminToken = auth.adminToken;
      userToken = auth.userToken;
      const movie = await movieRepository.save({
        title: 'Movie For Cast Remove',
        releaseDate: new Date('2023-01-01'),
        duration: 90
      });
      movieId = movie.id;
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'Test',
          lastName: 'Actor',
          popularity: 80
        })
      );
      actorId = actor.id;
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'Admin123!' });
      adminToken = adminLogin.body.access_token;
      const userLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'User123!' });
      userToken = userLogin.body.access_token;
    });

    it('should remove actor from cast when called by ADMIN', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/movies/${movieId}/actors/${actorId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .expect(204);

      const movieResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .expect(200);
      expect(movieResponse.body.cast).toHaveLength(0);
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/movies/${movieId}/actors/${actorId}`)
        .set('Authorization', 'Bearer ' + userToken)
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId, role: 'Lead', characters: ['A'] })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/movies/${movieId}/actors/${actorId}`)
        .expect(401);
    });

    it('should return 404 when movie does not exist', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/99999/actors/${actorId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .expect(404);
    });

    it('should return 404 when actor not in cast', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}/actors/${actorId}`)
        .set('Authorization', 'Bearer ' + adminToken)
        .expect(404);
    });
  });

  describe('POST /movies/:id/cast/delete', () => {
    let adminToken: string;
    let userToken: string;
    let movieId: number;
    let actor1Id: number;
    let actor2Id: number;

    beforeEach(async () => {
      await truncateTables(dataSource, ['cast', 'movies', 'actors', 'users']);
      const auth = await createAdminAndUser(userRepository, app);
      adminToken = auth.adminToken;
      userToken = auth.userToken;
      const movie = await movieRepository.save({
        title: 'Movie For Cast Delete',
        releaseDate: new Date('2023-01-01'),
        duration: 90
      });
      movieId = movie.id;
      const actor1 = await actorRepository.save(
        actorRepository.create({
          firstName: 'Actor',
          lastName: 'One',
          popularity: 80
        })
      );
      const actor2 = await actorRepository.save(
        actorRepository.create({
          firstName: 'Actor',
          lastName: 'Two',
          popularity: 75
        })
      );
      actor1Id = actor1.id;
      actor2Id = actor2.id;
    });

    it('should remove multiple actors from cast when called by ADMIN', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId: actor1Id, role: 'Lead', characters: ['A'] })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId: actor2Id, role: 'Support', characters: ['B'] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast/delete`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorIds: [actor1Id, actor2Id] })
        .expect(200);

      const movieResponse = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .expect(200);
      expect(movieResponse.body.cast).toHaveLength(0);
    });

    it('should return 403 when called by non-ADMIN', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId: actor1Id, role: 'Lead', characters: ['A'] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast/delete`)
        .set('Authorization', 'Bearer ' + userToken)
        .send({ actorIds: [actor1Id] })
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorId: actor1Id, role: 'Lead', characters: ['A'] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast/delete`)
        .send({ actorIds: [actor1Id] })
        .expect(401);
    });

    it('should return 404 when movie does not exist', async () => {
      await request(app.getHttpServer())
        .post('/movies/99999/cast/delete')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorIds: [actor1Id] })
        .expect(404);
    });

    it('should return 400 when actorIds is empty', async () => {
      await request(app.getHttpServer())
        .post(`/movies/${movieId}/cast/delete`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ actorIds: [] })
        .expect(400);
    });
  });

  describe('GET /movies/trending/pdf', () => {
    it('should return 200 with Content-Type application/pdf', async () => {
      await movieRepository.save([
        {
          title: 'Trending PDF Movie 1',
          releaseDate: new Date('2023-01-01'),
          duration: 90,
          trending: true
        },
        {
          title: 'Trending PDF Movie 2',
          releaseDate: new Date('2023-01-02'),
          duration: 100,
          trending: true
        }
      ]);

      const response = await request(app.getHttpServer())
        .get('/movies/trending/pdf')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should include Content-Disposition attachment header with filename', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/trending/pdf')
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(
        'trending-movies.pdf'
      );
    });

    it('should return a non-empty PDF buffer', async () => {
      await movieRepository.save({
        title: 'PDF Trending Movie',
        releaseDate: new Date('2023-01-01'),
        duration: 90,
        trending: true
      });

      const response = await request(app.getHttpServer())
        .get('/movies/trending/pdf')
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      // Verify PDF magic bytes (%PDF)
      expect(response.body.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should return a valid PDF even when there are no trending movies', async () => {
      await movieRepository.save({
        title: 'Not Trending',
        releaseDate: new Date('2023-01-01'),
        duration: 90,
        trending: false
      });

      const response = await request(app.getHttpServer())
        .get('/movies/trending/pdf')
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.body.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should be a public endpoint (no authentication required)', async () => {
      await movieRepository.save({
        title: 'Public PDF Movie',
        releaseDate: new Date('2023-01-01'),
        duration: 90,
        trending: true
      });

      // No Authorization header
      const response = await request(app.getHttpServer())
        .get('/movies/trending/pdf')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });
});
