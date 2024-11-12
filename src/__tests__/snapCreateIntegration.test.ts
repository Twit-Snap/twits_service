import mongoose from 'mongoose';
import { setupServer } from 'msw/node';
import request from 'supertest';
import app from '../app';
import TwitSnap from '../repositories/models/Snap';
import { JWTService } from '../service/jwtService';
import { http, HttpResponse } from 'msw';

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
        http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}`, () => {
          return HttpResponse.json({}, { status: 200 });
        })
      ]
    );
  });

  describe('POST /snaps', () => {
    it('should create a comment', async () => {
      const parent = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ user: user, content: 'test', type: 'comment', parent: parent.id });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toEqual('test');
      expect(response.body.data.type).toEqual('comment');
      expect(response.body.data.parent).toEqual(parent.id);
    });

    it('should raise a validationError if want to create a comment without parent', async () => {
      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ user: user, content: 'test', type: 'comment', parent: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Validation Error',
        status: 400,
        detail: 'Can not comment if no parent is provided',
        instance: '/snaps',
        'custom-field': 'parent'
      });
    });

    it('should raise a NotFoundError if want to create a comment with an inexistent parent', async () => {
      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({
          user: user,
          content: 'test',
          type: 'comment',
          parent: 'b1f0eb17-1af3-406f-8c7e-fd995f79b841'
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The Snap with ID b1f0eb17-1af3-406f-8c7e-fd995f79b841 was not found.',
        instance: '/snaps',
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should create a retwit', async () => {
      const parent = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ user: user, content: '', type: 'retwit', parent: parent.id });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toEqual('');
      expect(response.body.data.type).toEqual('retwit');
      expect(response.body.data.parent).toEqual(parent.id);
    });

    it('should raise a validationError if want to create a retwit without parent', async () => {
      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({ user: user, content: '', type: 'retwit', parent: undefined });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Validation Error',
        status: 400,
        detail: 'Can not retwit if no parent is provided',
        instance: '/snaps',
        'custom-field': 'parent'
      });
    });

    it('should raise a NotFoundError if want to create a retwit with an inexistent parent', async () => {
      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({
          user: user,
          content: '',
          type: 'retwit',
          parent: 'b1f0eb17-1af3-406f-8c7e-fd995f79b841'
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The Snap with ID b1f0eb17-1af3-406f-8c7e-fd995f79b841 was not found.',
        instance: '/snaps',
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should raise an EntityAlreadyExistsError if want to create a retwit that already exist', async () => {
      const parent = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1',
        type: 'original'
      });

      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1',
        parent: parent.id,
        type: 'retwit'
      });

      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({
          user: user,
          content: '',
          type: 'retwit',
          parent: parent.id
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        detail: `You already retwitted ${parent.id} already exist`,
        instance: '/snaps',
        status: 409,
        title: 'Conflict',
        type: 'about:blank',
        'custom-field': 'twit'
      });
    });

    it('should raise a ValidationError if want to create a retwit with an invalid parent', async () => {
      const parent = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1',
        type: 'original'
      });

      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1',
        parent: parent.id,
        type: 'retwit'
      });

      const response = await request(app)
        .post('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .send({
          user: user,
          content: '',
          type: 'retwit',
          parent: 'invalid-parent-id'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        detail: `Invalid UUID`,
        instance: '/snaps',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank',
        'custom-field': 'id'
      });
    });
  });
});
