import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actor } from '../src/actors/entities/actor.entity';
import { User } from '../src/users/entities/user.entity';
import { createTestApp, getTestModule } from './test-app.helper';
import { truncateTables } from './test-db.helper';
import { createAdminOnly } from './test-auth.helper';

describe('Actors (e2e)', () => {
  let app: INestApplication;
  let actorRepository: Repository<Actor>;
  let userRepository: Repository<User>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const testModule = getTestModule();
    actorRepository = testModule.get<Repository<Actor>>(
      getRepositoryToken(Actor)
    );
    userRepository = testModule.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await truncateTables(userRepository.manager.connection, [
      'cast',
      'actors',
      'users'
    ]);
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
