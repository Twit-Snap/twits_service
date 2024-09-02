import request from 'supertest';
import app from '../app';
import { UUID } from '../utils/uuid';

// Mock UUID
jest.mock('../utils/uuid', () => ({
  UUID: {
    generate: jest.fn().mockReturnValue('mocked-uuid'),
    isValid: jest.fn().mockReturnValue(true)
  }
}));

// Mock Snap model
const mockFind = jest.fn();
jest.mock('../repositories/models/Snap', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({
      _id: 'mocked-uuid',
      message: 'Test snap message'
    }),
    find: mockFind
  }));
});

describe('Snap API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /snaps', () => {
    it('should create a new snap', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({ message: 'Test snap message' })
        .expect(201);

      expect(response.body.data).toHaveProperty('id', 'mocked-uuid');
      expect(response.body.data.message).toBe('Test snap message');
      expect(UUID.generate).toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app).post('/snaps').send({}).expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'The message is required.');
      expect(response.body).toHaveProperty('instance');
    });
    it('should return 400 for message too long', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({ message: 'a'.repeat(281) })
        .expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'The message must not exceed 280 characters.');
      expect(response.body).toHaveProperty('instance');
    });
  });

  // describe('GET /snaps', () => {
  //   it('should retrieve all snaps', async () => {
  //     const mockSnaps = [
  //       { _id: '1', message: 'Snap 1' },
  //       { _id: '2', message: 'Snap 2' }
  //     ];

  //     mockFind.mockReturnValue({
  //       sort: jest.fn().mockResolvedValue(mockSnaps),
  //     });

  //     const response = await request(app).get('/snaps').expect(200);

  //     expect(response.body.data).toBeInstanceOf(Array);
  //     expect(response.body.data).toHaveLength(2);
  //     expect(response.body.data[0]).toHaveProperty('id');
  //     expect(response.body.data[0]).toHaveProperty('message');
  //     expect(mockFind).toHaveBeenCalled();
  //   });
  // });
});
