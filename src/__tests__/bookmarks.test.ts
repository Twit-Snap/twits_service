import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Bookmark from '../repositories/models/Bookmark';
import TwitSnap from '../repositories/models/Snap';
import { JWTService } from '../service/jwtService';
import { JwtCustomPayload } from '../types/jwt';
import { SnapResponse } from '../types/types';

const unsignedAuth: JwtCustomPayload = {
  type: 'user',
  email: 'test@test.com',
  userId: 1,
  username: 'test'
};

const auth = new JWTService().sign(unsignedAuth);

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
    await Bookmark.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Bookmark.deleteMany({});
  });

  describe('POST /bookmarks', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const response = await request(app).post('/bookmarks').send({ twitId: twit1ID });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: '/bookmarks',
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should create a new bookmark document', async () => {
      const response = await request(app)
        .post('/bookmarks')
        .send({ twitId: twit1ID })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(201);

      expect(response.body.data.userId).toEqual(unsignedAuth.userId);
      expect(typeof response.body.data.userId).toBe('number');
      expect(response.body.data.twitId).toEqual(twit1ID);
      expect(response.body.data.bookmarkedAt).toBeDefined();
    });

    it('should raise an error if twitId is undefined', async () => {
      const response = await request(app)
        .post('/bookmarks')
        .send({ twitId: undefined })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Twit ID required!',
        instance: '/bookmarks',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is not an UUID', async () => {
      const response = await request(app)
        .post('/bookmarks')
        .send({ twitId: 'twit1ID' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Invalid UUID',
        instance: '/bookmarks',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if the twit does not exist', async () => {
      const twit_id = 'd727a1de-d248-4c50-8647-5512a87f6488';

      const response = await request(app)
        .post(`/bookmarks/`)
        .send({ twitId: twit_id })
        .set({
          Authorization: `Bearer ${auth}`
        });
      // .expect(404);
      console.log(response.body);

      expect(response.body).toEqual({
        detail: `The Snap with ID ${twit_id} was not found.`,
        instance: `/bookmarks/`,
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });
  });

  describe('DELETE /bookmarks', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const response = await request(app).delete('/bookmarks').send({ twitId: twit1ID });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: '/bookmarks',
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should delete a Bookmark', async () => {
      await Bookmark.create({
        userId: unsignedAuth.userId,
        twitId: twit1ID
      });

      await request(app)
        .delete('/bookmarks')
        .send({ twitId: twit1ID })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(204);
    });

    it('should raise an error if there is no (userId, twitId) pair to delete', async () => {
      const response = await request(app)
        .delete('/bookmarks')
        .send({ twitId: twit1ID })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(404);

      expect(response.body).toEqual({
        detail: `The Bookmark with ID (user, twit) ; (${unsignedAuth.userId}, ${twit1ID}) was not found.`,
        instance: '/bookmarks',
        status: 404,
        title: 'Bookmark Not Found',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is undefined', async () => {
      const response = await request(app)
        .delete('/bookmarks')
        .send({ twitId: undefined })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Twit ID required!',
        instance: '/bookmarks',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is not an UUID', async () => {
      const response = await request(app)
        .delete('/bookmarks')
        .send({ twitId: 'twit1ID' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Invalid UUID',
        instance: '/bookmarks',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should raise an error if the twit does not exist', async () => {
      const twit_id = 'd727a1de-d248-4c50-8647-5512a87f6488';

      const response = await request(app)
        .delete(`/bookmarks/`)
        .send({ twitId: twit_id })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(404);

      expect(response.body).toEqual({
        detail: `The Snap with ID ${twit_id} was not found.`,
        instance: `/bookmarks/`,
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });
  });

  describe('/bookmarks/twits/:twitId', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const response = await request(app).get(`/bookmarks/twits/${twit1ID}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: `/bookmarks/twits/${twit1ID}`,
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should return the number of bookmarks for a twit', async () => {
      await Bookmark.create({
        userId: unsignedAuth.userId,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: 2,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: 2,
        twitId: twit2ID
      });

      const response = await request(app)
        .get(`/bookmarks/twits/${twit1ID}`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);
      expect(response.body.data).toEqual(2);
    });

    it('should return the bookmark count equal to zero if the tweet has no bookmarks', async () => {
      await Bookmark.create({
        userId: unsignedAuth.userId,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: 2,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: 2,
        twitId: twit2ID
      });

      const response = await request(app)
        .get(`/bookmarks/twits/${twit3ID}`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);
      expect(response.body.data).toEqual(0);
    });

    it('should raise an error if the twit does not exist', async () => {
      const twit_id = 'd727a1de-d248-4c50-8647-5512a87f6488';

      const response = await request(app)
        .get(`/bookmarks/twits/${twit_id}`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(404);
      expect(response.body).toEqual({
        detail: `The Snap with ID ${twit_id} was not found.`,
        instance: `/bookmarks/twits/${twit_id}`,
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should raise an error if twitId is not an UUID', async () => {
      const response = await request(app)
        .get(`/bookmarks/twits/twit1ID`)
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(400);

      expect(response.body).toEqual({
        'custom-field': 'twitId',
        detail: 'Invalid UUID',
        instance: '/bookmarks/twits/twit1ID',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });

  describe('/snaps for bookmarks', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const response = await request(app).get(`/snaps`).query({ bookmarks: true });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: "/snaps?bookmarks=true",
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should return all the bookmarks that the authorized user has', async () => {
      await Bookmark.create({
        userId: 2,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: unsignedAuth.userId,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: unsignedAuth.userId,
        twitId: twit2ID
      });

      const response = await request(app)
        .get(`/snaps`).query({ bookmarks: true })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toContain('Test snap 2');
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toContain('Test snap 1');
    });

    it('should not return any twits if the authorized user has not bookmarked any of them', async () => {
      await Bookmark.create({
        userId: 3,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: 2,
        twitId: twit1ID
      });

      await Bookmark.create({
        userId: 2,
        twitId: twit2ID
      });

      const response = await request(app)
        .get(`/snaps`).query({ bookmarks: true })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });
});
