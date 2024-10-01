import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import TwitSnap from '../repositories/models/Snap';
import { SnapResponse } from '../types/types';

describe('Snap users related API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
    await TwitSnap.deleteMany({});
  });

  afterAll(async () => {
    await TwitSnap.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await TwitSnap.deleteMany({});
  });

  describe('POST /snaps/users', () => {
    it('should return an empty array when no snaps exist', async () => {
      const response = await request(app)
        .post('/snaps/users')
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
        .post('/snaps/users')
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
        .post('/snaps/users')
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
      const response = await request(app).post('/snaps/users');

      expect(response.status).toBe(400);
    });
  });
});
