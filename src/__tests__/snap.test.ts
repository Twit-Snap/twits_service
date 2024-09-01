import request from 'supertest';
import app from '../app';
import Snap from '../repositories/models/Snap';

// Mock mongoose
jest.mock('mongoose');

// Mock Snap model
jest.mock('../repositories/models/Snap');

describe('Snap API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /snaps', () => {
    it('should create a new snap', async () => {
      const mockSnap = {
        id: '123456789',
        message: 'Test snap message'
      };

      (Snap.create as jest.Mock).mockResolvedValue(mockSnap);

      const response = await request(app)
        .post('/snaps')
        .send({ message: 'Test snap message' })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.message).toBe('Test snap message');
      expect(Snap.create).toHaveBeenCalledWith({ message: 'Test snap message' });
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app).post('/snaps').send({}).expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail');
      expect(response.body).toHaveProperty('instance');
    });
  });

  describe('GET /snaps', () => {
    it('should retrieve all snaps', async () => {
      const mockSnaps = [
        { id: '1', message: 'Snap 1' },
        { id: '2', message: 'Snap 2' }
      ];

      (Snap.find as jest.Mock).mockResolvedValue(mockSnaps);

      const response = await request(app).get('/snaps').expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('message');
      expect(Snap.find).toHaveBeenCalled();
    });
  });
});
