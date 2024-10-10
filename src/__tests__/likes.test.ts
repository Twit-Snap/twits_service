import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Like from '../repositories/models/Like';
import TwitSnap from '../repositories/models/Snap';
import { SnapResponse } from '../types/types';

describe('Snap API Tests', () => {
  var twit1ID: string | undefined = undefined;
  var twit2ID: string | undefined = undefined;
  var twit3ID: string | undefined = undefined;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');

    twit1ID = await TwitSnap.create({
      user: {
        userId: 1,
        name: 'Test User 1',
        username: 'testuser1'
      },
      content: 'Test snap 1'
    }).then(twit => twit._id);

    twit2ID = await TwitSnap.create({
      user: {
        userId: 2,
        name: 'Test User 2',
        username: 'testuser2'
      },
      content: 'Test snap 2'
    }).then(twit => twit._id);

    twit3ID = await TwitSnap.create({
      user: {
        userId: 3,
        name: 'Test User 3',
        username: 'testuser3'
      },
      content: 'Test snap 3'
    }).then(twit => twit._id);
  });

  afterAll(async () => {
    await TwitSnap.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Like.deleteMany({});
  });

  describe('POST /likes', () => {
    it('should create a new like document', async () => {
      const response = await request(app)
        .post('/likes')
        .send({ userId: 2, twitId: twit1ID })
        .expect(201);

      expect(response.body.data.userId).toEqual(2);
      expect(typeof response.body.data.userId).toBe('number');
      expect(response.body.data.twitId).toEqual(twit1ID);
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should raise an error if userId is undefined', async () => {
      const response = await request(app)
        .post('/likes')
        .send({ userId: undefined, twitId: twit1ID })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'User ID required!',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if userId is not numeric', async () => {
      const response = await request(app)
        .post('/likes')
        .send({ userId: 'jelou!', twitId: twit1ID })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'Invalid user ID, must be a number',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if userId is an empty string', async () => {
      const response = await request(app)
        .post('/likes')
        .send({ userId: '', twitId: twit1ID })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'User ID required!',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is undefined', async () => {
      const response = await request(app)
        .post('/likes')
        .send({ userId: 2, twitId: undefined })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Twit ID required!',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is not an UUID', async () => {
      const response = await request(app)
        .post('/likes')
        .send({ userId: 2, twitId: 'twit1ID' })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Invalid UUID',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });

  describe('DELETE /likes', () => {
    it('should delete a like', async () => {
      await Like.create({
        userId: 2,
        twitId: twit1ID
      });

      await request(app).delete('/likes').send({ userId: 2, twitId: twit1ID }).expect(204);
    });

    it('should raise an error if there is no (userId, twitId) pair to delete', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({ userId: 2, twitId: twit1ID })
        .expect(404);

      expect(response.body).toEqual({
        detail: `The Like with ID (user, twit) ; (2, ${twit1ID}) was not found.`,
        instance: '/likes',
        status: 404,
        title: 'Like Not Found',
        type: 'about:blank'
      });
    });

    it('should raise an error if userId is undefined', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({ userId: undefined, twitId: twit1ID })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'User ID required!',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if userId is not numeric', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({ userId: 'jelou!', twitId: twit1ID })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'Invalid user ID, must be a number',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if userId is an empty string', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({ userId: '', twitId: twit1ID })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'User ID required!',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is undefined', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({ userId: 2, twitId: undefined })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Twit ID required!',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is not an UUID', async () => {
      const response = await request(app)
        .delete('/likes')
        .send({ userId: 2, twitId: 'twit1ID' })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Invalid UUID',
        instance: '/likes',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });

  describe('/likes/twits/:twitId', () => {
    it('should return the number of likes for a twit', async () => {
      await Like.create({
        userId: 1,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit2ID
      });

      const response = await request(app).get(`/likes/twits/${twit1ID}`).expect(200);
      expect(response.body.data).toEqual(2);
    });

    it('should return the like count equal to zero if the tweet has no likes', async () => {
      await Like.create({
        userId: 1,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit2ID
      });

      const response = await request(app).get(`/likes/twits/${twit3ID}`).expect(200);
      expect(response.body.data).toEqual(0);
    });

    it('should raise an error if twitId is not an UUID', async () => {
      const response = await request(app).get(`/likes/twits/twit1ID`).expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Invalid UUID',
        instance: '/likes/twits/twit1ID',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });

  describe('likes/users/:userId', () => {
    it('should return all the likes that the user has', async () => {
      await Like.create({
        userId: 1,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit2ID
      });

      const user_id = 2;

      const response = await request(app).get(`/likes/users/${user_id}`).expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should not return any twits if the user has not liked any of them', async () => {
      await Like.create({
        userId: 1,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit1ID
      });

      await Like.create({
        userId: 2,
        twitId: twit2ID
      });

      const user_id = 3;

      const response = await request(app).get(`/likes/users/${user_id}`).expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should raise an error if userId is not numeric', async () => {
      const user_id = 'jelou';

      const response = await request(app).get(`/likes/users/${user_id}`).expect(400);

      expect(response.body).toEqual({
        'custom-field': 'userId',
        detail: 'Invalid user ID, must be a number',
        instance: '/likes/users/jelou',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });
});
