import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import app from '../app';
import { JWTService } from '../service/jwtService';
import { JwtCustomPayload } from '../types/jwt';

const unsignedAuth: JwtCustomPayload = {
  type: 'user',
  email: 'test@test.com',
  userId: 1,
  username: 'test'
};

const auth = new JWTService().sign(unsignedAuth);

const server = setupServer();

describe('Snap API Tests', () => {
  afterAll(async () => {
    server.close();
  });

  beforeEach(async () => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  describe('GET snaps/trending', () => {
    it('should return all trending words', async () => {
      server.resetHandlers(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${unsignedAuth.username}`, () => {
            return HttpResponse.json({}, { status: 200 });
          }),
          http.post(`${process.env.FEED_ALGORITHM_URL}/trending`, () => {
            return HttpResponse.json(
              { trends: { data: [{ hola: 1 }, { test: 2 }] } },
              { status: 200 }
            );
          })
        ]
      );

      const response = await request(app)
        .get('/snaps/trending')
        .set({
          Authorization: `Bearer ${auth}`
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([{ hola: 1 }, { test: 2 }]);
    });

    it('should throw a ServiceUnavailable error if the service is having problems', async () => {
      server.resetHandlers(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${unsignedAuth.username}`, () => {
            return HttpResponse.json({}, { status: 200 });
          }),
          http.post(`${process.env.FEED_ALGORITHM_URL}/trending`, () => {
            return HttpResponse.json({}, { status: 500 });
          })
        ]
      );

      const response = await request(app)
        .get('/snaps/trending')
        .set({
          Authorization: `Bearer ${auth}`
        });

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        detail: 'The server is not ready to handle the request.',
        instance: '/snaps/trending',
        status: 503,
        title: 'Service unavailable',
        type: 'about:blank'
      });
    });

    
  });
});
