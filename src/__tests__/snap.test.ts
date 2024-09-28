import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import Snap from '../repositories/models/Snap';
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
    await Snap.deleteMany({});
  });

  describe('GET /snaps', () => {
    it('should return an empty array when no snaps exist', async () => {
      const response = await request(app).get('/snaps');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return all snaps when multiple snaps exist', async () => {
      await Snap.create({ content: 'Test snap 1' });
      await Snap.create({ content: 'Test snap 2' });
      await Snap.create({ content: 'Test snap 3' });

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
      await Snap.create({ message: 'Test snap' });

      const response = await request(app).get('/snaps');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      const snap = response.body.data[0];
      expect(snap.id).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.message).toBe('Test snap');
    });
  });

  describe('GET /snaps/:id', () => {
    it('should return a snap when given a valid ID', async () => {
      const createdSnap = await Snap.create({ message: 'Test snap' });

      const response = await request(app).get(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(createdSnap.id);
      expect(response.body.data.message).toBe('Test snap');
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
      const createdSnap = await Snap.create({ message: 'Detailed snap' });

      const response = await request(app).get(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(200);

      const snap = response.body.data;
      expect(snap.id).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.message).toBe('Detailed snap');
    });
  });

  describe('DELETE /snaps/:id', () => {
    it('should delete a snap when given a valid ID', async () => {
      const createdSnap = await Snap.create({ message: 'Test snap to delete' });

      const response = await request(app).delete(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(204);

      const deletedSnap = await Snap.findById(createdSnap.id);
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
});
