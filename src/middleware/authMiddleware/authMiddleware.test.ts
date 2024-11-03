import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { initializeEnvironment } from '../../app';
import { JWTService } from '../../service/jwtService';
import {
  AuthenticationError,
  BlockedError,
  NotFoundError,
  ServiceUnavailable,
  ValidationError
} from '../../types/customErrors';
import { JwtUserPayload } from '../../types/jwt';
import { checkBlockedUser, decodeToken } from './authMiddleware';

const user = {
  email: 'test@test.com',
  userId: 1,
  username: 'test'
};

const admin = {
  email: 'admin@admin.com',
  username: 'admin'
};

const server = setupServer();

describe('Snap API Tests', () => {
  beforeAll(() => {
    initializeEnvironment();
  });

  afterAll(async () => {
    server.close();
  });

  beforeEach(async () => {
    server.listen({ onUnhandledRequest: 'bypass' });
    server.resetHandlers();
  });

  describe('checkBlockedUserTests', () => {
    it('should not raise an error because an admin can not be blocked', async () => {
      await expect(checkBlockedUser({ type: 'admin', ...admin })).resolves.not.toThrow();
    });

    it('should not raise an error if the user exist and is not blocked', async () => {
      server.resetHandlers(
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 200 });
        })
      );

      await expect(checkBlockedUser({ type: 'user', ...user })).resolves.not.toThrow();
    });

    it("should raise a ValidationError if the user's username is invalid", async () => {
      server.resetHandlers(
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 400 });
        })
      );

      await expect(checkBlockedUser({ type: 'user', ...user })).rejects.toBeInstanceOf(
        ValidationError
      );
    });

    it('should raise an AuthenticationError if the decodedToken has invalid fields', async () => {
      server.resetHandlers(
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 401 });
        })
      );

      await expect(checkBlockedUser({ type: 'user', ...user })).rejects.toBeInstanceOf(
        AuthenticationError
      );
    });

    it('should raise a BlockedError if the user is blocked', async () => {
      server.resetHandlers(
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 403 });
        })
      );

      await expect(checkBlockedUser({ type: 'user', ...user })).rejects.toBeInstanceOf(
        BlockedError
      );
    });

    it("should raise a NotFoundError if the user's username does not exist", async () => {
      server.resetHandlers(
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 404 });
        })
      );

      await expect(checkBlockedUser({ type: 'user', ...user })).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it('should raise a ServiceUnavailable error if the service has problems', async () => {
      server.resetHandlers(
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      await expect(checkBlockedUser({ type: 'user', ...user })).rejects.toBeInstanceOf(
        ServiceUnavailable
      );
    });
  });

  describe('decodeToken', () => {
    const token = new JWTService().sign({ type: 'user', ...user });

    it('should return the token', () => {
      const ret = decodeToken(`Bearer ${token}`) as JwtUserPayload;
      expect(ret.type).toBe('user');
      expect(ret.email).toBe(user.email);
      expect(ret.userId).toBe(user.userId);
      expect(ret.username).toBe(user.username);
    });

    it('should raise an Authentication Error if no token is provided', () => {
      expect(() => decodeToken(undefined)).toThrow(AuthenticationError);
    });
  });
});
