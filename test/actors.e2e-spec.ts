import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Actor } from '../src/actors/entities/actor.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminOnly } from './test-auth.helper';

describe('Actors (e2e)', () => {
  let app: INestApplication;
  let actorRepository: Repository<Actor>;
  let movieRepository: Repository<Movie>;
  let userRepository: Repository<User>;
  let adminToken: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    actorRepository = testModule.get<Repository<Actor>>(
      getRepositoryToken(Actor)
    );
    movieRepository = testModule.get<Repository<Movie>>(
      getRepositoryToken(Movie)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
    dataSource = userRepository.manager.connection;
  });

  beforeEach(async () => {
    await truncateTables(dataSource, ['cast', 'movies', 'actors', 'users']);
    const auth = await createAdminOnly(userRepository, app);
    adminToken = auth.adminToken;
  });

  describe('GET /actors/:id', () => {
    it('should return actor by id (public)', async () => {
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'John',
          lastName: 'Doe',
          popularity: 80
        })
      );

      const res = await request(app.getHttpServer())
        .get(`/actors/${actor.id}`)
        .expect(200);
      expect(res.body.firstName).toBe('John');
      expect(res.body.lastName).toBe('Doe');
    });

    it('should return 404 for non-existent actor', async () => {
      await request(app.getHttpServer()).get('/actors/99999').expect(404);
    });

    it('should be a public endpoint (no auth required)', async () => {
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'Public',
          lastName: 'Actor',
          popularity: 50
        })
      );

      const res = await request(app.getHttpServer())
        .get(`/actors/${actor.id}`)
        .expect(200);
      expect(res.body.firstName).toBe('Public');
    });

    it('should return actor with cast when actor has cast', async () => {
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'Cast',
          lastName: 'Actor',
          popularity: 90
        })
      );
      const movie = await movieRepository.save({
        title: 'Movie With Cast',
        releaseDate: new Date('2023-01-01'),
        duration: 100
      });
      await request(app.getHttpServer())
        .post(`/movies/${movie.id}/cast`)
        .set('Authorization', 'Bearer ' + adminToken)
        .send({
          actorId: actor.id,
          role: 'Lead',
          characters: ['Main Character']
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/actors/${actor.id}`)
        .expect(200);
      expect(res.body.firstName).toBe('Cast');
      expect(res.body).toHaveProperty('cast');
      expect(Array.isArray(res.body.cast)).toBe(true);
      expect(res.body.cast.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /actors', () => {
    it('should create actor when ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/actors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          birthdate: '1990-05-15',
          popularity: 75
        })
        .expect(201);
      expect(res.body.firstName).toBe('Jane');
      expect(res.body.lastName).toBe('Smith');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/actors')
        .send({ firstName: 'Jane', lastName: 'Smith' })
        .expect(401);
    });
  });

  describe('PATCH /actors/:id', () => {
    it('should update actor when ADMIN', async () => {
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'Old',
          lastName: 'Name',
          popularity: 50
        })
      );

      const res = await request(app.getHttpServer())
        .patch(`/actors/${actor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' })
        .expect(200);
      expect(res.body.firstName).toBe('Updated');
    });
  });

  describe('DELETE /actors/:id', () => {
    it('should delete actor when ADMIN', async () => {
      const actor = await actorRepository.save(
        actorRepository.create({
          firstName: 'ToDelete',
          lastName: 'Actor',
          popularity: 10
        })
      );

      await request(app.getHttpServer())
        .delete(`/actors/${actor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const found = await actorRepository.findOne({ where: { id: actor.id } });
      expect(found).toBeNull();
    });
  });
});
