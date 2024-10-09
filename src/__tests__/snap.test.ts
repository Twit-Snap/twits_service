import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import TwitSnap from '../repositories/models/Snap';
import { UUID } from '../utils/uuid';
import { SnapResponse } from '../types/types';

describe('Snap API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await TwitSnap.deleteMany({});
  });

  describe('GET /snaps', () => {
    it('should return an empty array when no snaps exist', async () => {
      const response = await request(app).get('/snaps');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return all snaps when multiple snaps exist', async () => {
      await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user : {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user : {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app).get('/snaps');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3',
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should return snaps with correct structure', async () => {
      await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap'
      });

      const response = await request(app).get('/snaps');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      const snap = response.body.data[0];
      expect(snap.id).toBeDefined();
      expect(snap.user.userId).toBeDefined();
      expect(snap.user.name).toBeDefined();
      expect(snap.user.username).toBeDefined();
      expect(snap.content).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(typeof snap.user.userId).toBe('number');
      expect(typeof snap.user.name).toBe('string');
      expect(typeof snap.user.username).toBe('string');
      expect(typeof snap.content).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.content).toBe('Test snap');
    });
  });

  describe('GET /snaps/:id', () => {
    it('should return a snap when given a valid ID', async () => {
      const createdSnap = await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap'
      });

      const response = await request(app).get(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.id).toBe(createdSnap.id);
      expect(response.body.data.content).toBe('Test snap');
    });

    it('should return 404 when given a non-existent ID', async () => {
      const nonExistentId = 'e0462215-9238-4919-a4e0-0be725d7ed57';

      const response = await request(app).get(`/snaps/${nonExistentId}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The Snap with ID e0462215-9238-4919-a4e0-0be725d7ed57 was not found.',
        instance: '/snaps/e0462215-9238-4919-a4e0-0be725d7ed57',
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should return 400 when given an invalid ID format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app).get(`/snaps/${invalidId}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'id',
        detail: 'Invalid UUID',
        instance: '/snaps/invalid-id-format',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should return snap with correct structure', async () => {
      const createdSnap = await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Detailed snap'
      });

      const response = await request(app).get(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(200);

      const snap = response.body.data;
      expect(snap.id).toBeDefined();
      expect(snap.user.userId).toBeDefined();
      expect(snap.user.name).toBeDefined();
      expect(snap.user.username).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(typeof snap.user.userId).toBe('number');
      expect(typeof snap.user.name).toBe('string');
      expect(typeof snap.user.username).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.content).toBe('Detailed snap');
    });
  });

  describe('DELETE /snaps/:id', () => {
    it('should delete a snap when given a valid ID', async () => {
      const createdSnap = await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test twit to delete'
      });

      const response = await request(app).delete(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(204);

      const deletedSnap = await TwitSnap.findById(createdSnap.id);
      expect(deletedSnap).toBeNull();
    });

    it('should return 404 when trying to delete a non-existent snap', async () => {
      const nonExistentId = 'e0462215-9238-4919-a4e0-0be725d7ed57';

      const response = await request(app).delete(`/snaps/${nonExistentId}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The Snap with ID e0462215-9238-4919-a4e0-0be725d7ed57 was not found.',
        instance: '/snaps/e0462215-9238-4919-a4e0-0be725d7ed57',
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should return 400 when given an invalid ID format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app).delete(`/snaps/${invalidId}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'id',
        detail: 'Invalid UUID',
        instance: '/snaps/invalid-id-format',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });

  describe('GET /snaps/by_username/:username', () => {
    it('should return an empty array with a non-existent username ', async () => {
      await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap'
      });
      const invalidUsername = 'username test';
      const response = await request(app).get(`/snaps/by_username/${invalidUsername}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });
    it('should return a snap if is a unique snap with the username ', async () => {
      const createdSnap = await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap'
      });
      const response = await request(app).get(`/snaps/by_username/${createdSnap.user.username}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      const snap = response.body.data[0];
      expect(snap.user.username).toEqual(createdSnap.user.username);
      expect(snap.content).toEqual(createdSnap.content);
    });
    it('should return an array of snaps with the same username', async () => {
      const validUsername = 'testuser'
      await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: validUsername
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user : {
          userId: 2,
          name: 'Test User',
          username: validUsername
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user : {
          userId: 3,
          name: 'Test User',
          username: validUsername
        },
        content: 'Test snap 3'
      });
      const response = await request(app).get(`/snaps/by_username/${validUsername}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3',
        'Test snap 2',
        'Test snap 1'
      ]);
    });
    //Todo
    it('should return 400 when given an empty username ', async () => {
      const username = '';
      const response = await request(app).get(`/snaps/by_username/${username}`);
      /*
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          detail: 'Username required!',
          instance: `/snaps/by_username/${username}`,
          status: 400,
          title: 'Validation Error',
          type: 'about:blank'
        });
        */
    });
    it('should return snap with correct structure', async () => {
      const createdSnap = await TwitSnap.create({
        user : {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Detailed snap'
      });
      const response = await request(app).get(`/snaps/by_username/${createdSnap.user.username}`);
      expect(response.status).toBe(200);
      const snap = response.body.data[0];
      expect(snap.id).toBeDefined();
      expect(snap.user.userId).toBeDefined();
      expect(snap.user.name).toBeDefined();
      expect(snap.user.username).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(typeof snap.user.userId).toBe('number');
      expect(typeof snap.user.name).toBe('string');
      expect(typeof snap.user.username).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.content).toBe('Detailed snap');
    });
  });
});
