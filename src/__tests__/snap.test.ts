import mongoose from 'mongoose';
import Snap from '../repositories/models/Snap';
import { UUID } from '../utils/uuid';

describe('Snap Model Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Snap.deleteMany({});
  });

  describe('Get All Snaps', () => {
    it('should return an empty array when no snaps exist', async () => {
      const snaps = await Snap.find();
      expect(snaps).toEqual([]);
    });

    it('should return all snaps when multiple snaps exist', async () => {
      await Snap.create({ message: 'Test snap 1' });
      await Snap.create({ message: 'Test snap 2' });
      await Snap.create({ message: 'Test snap 3' });

      const snaps = await Snap.find();
      expect(snaps).toHaveLength(3);
      expect(snaps.map(snap => snap.message)).toEqual([
        'Test snap 1',
        'Test snap 2',
        'Test snap 3'
      ]);
    });

    it('should return snaps with correct structure', async () => {
      await Snap.create({ message: 'Test snap' });
      const snaps = await Snap.find();

      expect(snaps).toHaveLength(1);
      const snap = snaps[0];
      expect(snap._id).toBeDefined();
      expect(typeof snap._id).toBe('string');
      expect(UUID.isValid(snap._id)).toBe(true);
      expect(snap.message).toBe('Test snap');
    });
  });
});
