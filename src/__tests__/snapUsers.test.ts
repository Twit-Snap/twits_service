import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import TwitSnap from '../repositories/models/Snap';
import { SnapResponse } from '../types/types';

describe('Snap users related API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
  });

  afterAll(async () => {
    await TwitSnap.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await TwitSnap.deleteMany({});
  });

  describe('POST /snaps/by_users', () => {
    it('should return an empty array when no snaps exist', async () => {
      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return all snaps belonging to the user', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1] })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should return all snaps belonging to all specified users', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1, 2, 3] })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3',
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should return a status code of 400 when no body is specified', async () => {
      const response = await request(app).post('/snaps/by_users');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'usersId',
        detail: 'Users IDs required!',
        instance: '/snaps/by_users',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should return a status code of 400 when usersIds is not a list', async () => {
      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: { ids: [1, 2, 3] } });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'usersId',
        detail: 'Users IDs must be an array of IDs!',
        instance: '/snaps/by_users',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should return up to limit items if limit is specified', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1, 2, 3] })
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should return up to 20 items if limit is not specified', async () => {
      for (let i = 0; i < 25; i++) {
        await TwitSnap.create({
          user: {
            userId: 1,
            name: `Test User 1`,
            username: `testuser1`
          },
          content: `Test snap 1`
        });
      }

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1] })
        .expect(200);

      expect(response.body.data).toHaveLength(20);
    });

    it('should return items older than createdAt as default behaviour', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      const twit = await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1, 2, 3] })
        .query({ createdAt: twit.createdAt })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual(['Test snap 1']);
    });

    it('should return items older than createdAt if older is false', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      const twit = await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1, 2, 3] })
        .query({ createdAt: twit.createdAt, older: false })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual(['Test snap 1']);
    });

    it('should return items newer than createdAt if older is true', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      const twit = await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .post('/snaps/by_users')
        .send({ usersIds: [1, 2, 3] })
        .query({ createdAt: twit.createdAt, older: true })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual(['Test snap 3']);
    });
  });
});
