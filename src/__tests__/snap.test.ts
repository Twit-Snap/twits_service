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
      await Snap.create({ message: 'Test snap 1' });
      await Snap.create({ message: 'Test snap 2' });
      await Snap.create({ message: 'Test snap 3' });

      const response = await request(app).get('/snaps');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.message)).toEqual([
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
});
