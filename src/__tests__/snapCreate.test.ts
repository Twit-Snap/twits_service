import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import app from '../app';
import { JWTService } from '../service/jwtService';
import { UUID } from '../utils/uuid';

const user = {
  email: 'test@test.com',
  userId: 1,
  username: 'test'
};

const auth = new JWTService().sign({
  type: 'user',
  ...user
});

const server = setupServer();

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
      content: 'Test snap message',
      user: {
        userId: 1,
        name: 'Test User 1',
        username: 'testuser1'
      }
    })
  }));
});

describe('Snap API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.listen({ onUnhandledRequest: 'bypass' });
    server.resetHandlers(
      ...[
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 200 });
        })
      ]
    );
  });

  afterAll(() => {
    server.close();
  });

  describe('POST /snaps', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({
          user: {
            userId: 1,
            name: 'Test User 1',
            username: 'testuser1'
          },
          content: 'Test snap message',
          entities: {
            hashtags: []
          }
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: '/snaps',
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should create a new snap', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({
          user: {
            userId: 1,
            name: 'Test User 1',
            username: 'testuser1'
          },
          content: 'Test snap message',
          entities: {
            hashtags: []
          }
        })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id', 'mocked-uuid');
      expect(response.body.data.content).toBe('Test snap message');
      expect(UUID.generate).toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({})
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

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
          user: {
            userId: 1,
            name: 'Test User 1',
            username: 'testuser1'
          },
          content: 'a'.repeat(281),
          entities: {
            hashtags: []
          }
        })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty(
        'detail',
        'The content of the TwitSnap must not exceed 280 characters.'
      );
      expect(response.body).toHaveProperty('instance');
    });

    it('should return 400 for user without id', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({
          user: {
            userId: undefined,
            name: 'Test User 1',
            username: 'testuser1'
          },
          content: 'a',
          entities: {
            hashtags: []
          }
        })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'User ID must be specified');
      expect(response.body).toHaveProperty('instance');
    });

    it('should return 400 for user without username', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({
          user: {
            userId: 1,
            name: 'Test User 1',
            username: undefined
          },
          content: 'a',
          entities: {
            hashtags: []
          }
        })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'User username must be specified');
      expect(response.body).toHaveProperty('instance');
    });

    it('should return 400 for user without name', async () => {
      const response = await request(app)
        .post('/snaps')
        .send({
          user: {
            userId: 1,
            name: undefined,
            username: 'testuser1'
          },
          content: 'a',
          entities: {
            hashtags: []
          }
        })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toHaveProperty('type', 'about:blank');
      expect(response.body).toHaveProperty('title', 'Validation Error');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail', 'User name must be specified');
      expect(response.body).toHaveProperty('instance');
    });
  });
});
