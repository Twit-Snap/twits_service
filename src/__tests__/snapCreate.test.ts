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
jest.mock('../repositories/models/Snap', () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({
      id: 'mocked-uuid',
      content: 'Test snap message'
    })
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
        .send({
          user : {
            userId: 1,
            name: 'Test User 1',
            username: 'testuser1'
          },
          content: 'Test snap message'
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id', 'mocked-uuid');
      expect(response.body.data.content).toBe('Test snap message');
      expect(UUID.generate).toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app).post('/snaps').send({}).expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'The TwitSnap content is required.');
      expect(response.body).toHaveProperty('instance');
    });
    it('should return 400 for message too long', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({
          user : {
            userId: 1,
            name: 'Test User 1',
            username: 'testuser1'
          },
          content: 'a'.repeat(281)
        })
        .expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'The content of the TwitSnap must not exceed 280 characters.');
      expect(response.body).toHaveProperty('instance');
    });
  });
});
