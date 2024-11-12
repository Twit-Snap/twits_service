import mongoose from 'mongoose';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import app from '../app';
import TwitSnap from '../repositories/models/Snap';
import { JWTService } from '../service/jwtService';
import { SnapResponse } from '../types/types';

const user = {
  email: 'test@test.com',
  userId: 1,
  username: 'test',
  name: 'test'
};

// const admin = {
//   email: 'admin@admin.com',
//   username: 'admin'
// };

const auth = new JWTService().sign({ ...user, type: 'user' });

const server = setupServer();

describe('Snap API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
  });

  afterAll(async () => {
    await TwitSnap.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    await TwitSnap.deleteMany({});
    server.listen({ onUnhandledRequest: 'bypass' });
    server.resetHandlers(
      ...[
        http.get(`${process.env.FEED_ALGORITHM_URL}/`, () => {
          return HttpResponse.json({}, { status: 200 });
        }),
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 200 });
        })
      ]
    );
  });

  describe('PATCH /snaps', () => {
    it('should edit a twit', async () => {
      const twit = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .patch(`/snaps/${twit.id}`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ content: 'test' });

      expect(response.status).toBe(204);

      const edit = (await TwitSnap.findById(twit.id)) as SnapResponse;
      expect(edit.content).toEqual('test');
      expect(edit.type).toEqual('original');
      expect(edit.parent).toEqual(null);
    });

    it('should raise a validationError if want to edit a twit using undefined content', async () => {
      const twit = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .patch(`/snaps/${twit.id}`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ content: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Validation Error',
        status: 400,
        detail: 'The TwitSnap content is required.',
        instance: `/snaps/${twit.id}`,
        'custom-field': 'content'
      });
    });

    it('should raise a validationError if want to edit a twit using content with length > 280', async () => {
      const twit = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .patch(`/snaps/${twit.id}`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ content: 'a'.repeat(281) });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Validation Error',
        status: 400,
        detail: 'The content of the TwitSnap must not exceed 280 characters.',
        instance: `/snaps/${twit.id}`,
        'custom-field': 'a'.repeat(281)
      });
    });

    it('should raise a validationError if want to edit a twit using an invalid id', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .patch(`/snaps/invalid-id`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ content: 'a' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid UUID',
        instance: `/snaps/invalid-id`,
        'custom-field': 'id'
      });
    });

    it('should raise a validationError if want to edit a twit that does not exist', async () => {
      const response = await request(app)
        .patch(`/snaps/1b69f7e5-5f15-4915-b565-d341b72e1076`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ content: 'a' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Snap Not Found',
        status: 404,
        detail: 'The Snap with ID 1b69f7e5-5f15-4915-b565-d341b72e1076 was not found.',
        instance: `/snaps/1b69f7e5-5f15-4915-b565-d341b72e1076`
      });
    });
  });
});
