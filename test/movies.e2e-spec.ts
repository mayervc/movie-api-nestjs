import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../src/movies/entities/movie.entity';
import { createTestApp, getTestModule } from './test-app.helper';

describe('MoviesController (e2e)', () => {
  let app: INestApplication;
  let movieRepository: Repository<Movie>;

  beforeAll(async () => {
    // La aplicación de test se crea después de que el setup global complete
    // El setup global ya garantiza que las tablas estén disponibles
    app = await createTestApp();

    // Obtener MovieRepository para los tests
    const testModule = getTestModule();
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
  });

  beforeEach(async () => {
    // Limpiar películas antes de cada test
    if (movieRepository) {
      try {
        await movieRepository.query('TRUNCATE TABLE "movies" CASCADE');
      } catch (error) {
        // Ignorar errores si la tabla no existe o ya está vacía
      }
    }
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

      const movie2 = await movieRepository.save({
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
});
