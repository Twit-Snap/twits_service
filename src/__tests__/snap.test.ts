import mongoose from 'mongoose';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import app from '../app';
import TwitSnap from '../repositories/models/Snap';
import { JWTService } from '../service/jwtService';
import { SnapResponse } from '../types/types';
import { UUID } from '../utils/uuid';

const user = {
  email: 'test@test.com',
  userId: 1,
  username: 'test'
};

const admin = {
  email: 'admin@admin.com',
  username: 'admin'
}

const auth = new JWTService().sign({ ...user, type: 'user' });
const authAdmin = new JWTService().sign({ ...admin, type: 'admin' });

describe('Snap API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test_db');
  });

  afterAll(async () => {
    await TwitSnap.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await TwitSnap.deleteMany({});
  });

  describe('GET /snaps', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const response = await request(app).get('/snaps');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: '/snaps',
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should return an empty array when no snaps exist', async () => {
      const response = await request(app)
        .get('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return all snaps when multiple snaps exist', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1',
        entities: {
          hashtags: []
        }
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2',
        entities: {
          hashtags: []
        }
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app)
        .get('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3',
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should return snaps with correct structure', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app)
        .get('/snaps')
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      const snap = response.body.data[0];
      expect(snap.id).toBeDefined();
      expect(snap.user.userId).toBeDefined();
      expect(snap.user.name).toBeDefined();
      expect(snap.user.username).toBeDefined();
      expect(snap.content).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(typeof snap.user.userId).toBe('number');
      expect(typeof snap.user.name).toBe('string');
      expect(typeof snap.user.username).toBe('string');
      expect(typeof snap.content).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.content).toBe('Test snap');
    });

    it('should return up to limit items if limit is specified', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ limit: 2 })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    }, 10000);

    it('should return up to 20 items if limit is not specified', async () => {
      for (let i = 0; i < 25; i++) {
        await TwitSnap.create({
          user: {
            userId: 1,
            name: `Test User 1`,
            username: `testuser1`
          },
          content: `Test snap 1`
        });
      }

      const response = await request(app)
        .get('/snaps/')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(20);
    });

    it('should return items newer than createdAt as default behaviour', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      const twit = await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ createdAt: twit.createdAt })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual(['Test snap 3']);
    });

    it('should return items older than createdAt if older is true', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      const twit = await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ createdAt: twit.createdAt, older: true })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual(['Test snap 1']);
    });

    it('should return items newer than createdAt if older is false', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      const twit = await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ createdAt: twit.createdAt, older: false })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual(['Test snap 3']);
    });

    it("should return items that has 'hello' his content", async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'hello Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ has: 'hello' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'hello Test snap 2'
      ]);
    });

    it('should return all items if has param is undefined', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'hello Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ has: undefined })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3',
        'hello Test snap 2',
        'Test snap 1'
      ]);
    });

    it("should return items that have part of the word 'hello' ('hel') in his content", async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'hello Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ has: 'hel' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'hello Test snap 2'
      ]);
    });

    it("should not return items if no one has 'has' in his content", async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'hello Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ has: 'this-is-a-test' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it("should return items that have part of the word 'hello' ('hel') in his content case insensitive", async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'hello Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ has: 'HeL' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'hello Test snap 2'
      ]);
    });

    it("should return items in unicode when 'has' is a emoji", async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1 😎😎😎'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'hello Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3 😎🤓👆'
      });

      const response = await request(app)
        .get('/snaps/')
        .query({ has: '😎' })
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3 😎🤓👆',
        'Test snap 1 😎😎😎'
      ]);
    });

    it('should return an empty array if no twit exist for a non-existent username', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap'
      });

      const invalidUsername = 'username test';
      const response = await request(app)
        .get(`/snaps`)
        .query({ username: invalidUsername })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return a snap if is a unique snap with the username ', async () => {
      const createdSnap = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap'
      });
      const response = await request(app)
        .get(`/snaps`)
        .query({ username: createdSnap.user.username })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      const snap = response.body.data[0];
      expect(snap.user.username).toEqual(createdSnap.user.username);
      expect(snap.content).toEqual(createdSnap.content);
    });

    it('should return an array of snaps with the same username', async () => {
      const validUsername = 'testuser';
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: validUsername
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: validUsername
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: validUsername
        },
        content: 'Test snap 3'
      });
      const response = await request(app)
        .get(`/snaps`)
        .query({ username: validUsername })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 3',
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should return an array of snaps of the users it follows', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });
      await TwitSnap.create({
        user: {
          userId: 4,
          name: 'Test User',
          username: 'TestUser4'
        },
        content: 'Test snap 4'
      });

      const server = setupServer(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, () => {
            return HttpResponse.json([
              {
                id: 2,
                name: 'Test User',
                username: 'TestUser2'
              },
              {
                id: 4,
                name: 'Test User',
                username: 'TestUser4'
              }
            ]);
          })
        ]
      );
      server.listen();

      const response = await request(app)
        .get(`/snaps`)
        .query({ byFollowed: true })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((snap: SnapResponse) => snap.user.userId)).toEqual([4, 2]);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 4',
        'Test snap 2'
      ]);
      server.close();
    });

    it('should return an empty array of snaps if the user is not follows anyone', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });
      await TwitSnap.create({
        user: {
          userId: 4,
          name: 'Test User',
          username: 'TestUser4'
        },
        content: 'Test snap 4'
      });

      const server = setupServer(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, () => {
            return HttpResponse.json([]);
          })
        ]
      );
      server.listen();

      const response = await request(app)
        .get(`/snaps`)
        .query({ byFollowed: true })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.data.map((snap: SnapResponse) => snap.user.userId)).toEqual([]);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([]);
      server.close();
    })

    it('should return an array of snaps with the first one equal to the position of the offset', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get(`/snaps`)
        .query({ offset: 1 })
        .set({
          Authorization: `Bearer ${auth}`
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Test snap 2',
        'Test snap 1'
      ]);
    });

    it('should raise 400 error with invalid Date format', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });

      const response = await request(app)
        .get(`/snaps`)
        .query({ createdAt: 'invalidDateFormat' })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Validation Error",
        status: 400,
        detail: "Invalid date format.",
        instance: "/snaps?createdAt=invalidDateFormat",
        'custom-field': "createdAt"
      });
    });

    it('should pass the error received by the service on which it depends (case 400)', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });
      await TwitSnap.create({
        user: {
          userId: 4,
          name: 'Test User',
          username: 'TestUser4'
        },
        content: 'Test snap 4'
      });

      const server = setupServer(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, () => {
            return HttpResponse.json({ field: 'username', detail: user.username }, { status: 400 });
          })
        ]
      );
      server.listen();

      const response = await request(app)
        .get(`/snaps`)
        .query({ byFollowed: true })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'username',
        detail: 'test',
        instance: '/snaps?byFollowed=true',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });

      server.close();
    });

    it('should pass the error received by the service on which it depends (case 401)', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });
      await TwitSnap.create({
        user: {
          userId: 4,
          name: 'Test User',
          username: 'TestUser4'
        },
        content: 'Test snap 4'
      });

      const server = setupServer(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, () => {
            return HttpResponse.json({}, { status: 401 });
          })
        ]
      );
      server.listen();

      const response = await request(app)
        .get(`/snaps`)
        .query({ byFollowed: true })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: '/snaps?byFollowed=true',
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });

      server.close();
    });

    it('should pass the error received by the service on which it depends (case 404)', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });
      await TwitSnap.create({
        user: {
          userId: 4,
          name: 'Test User',
          username: 'TestUser4'
        },
        content: 'Test snap 4'
      });

      const server = setupServer(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, () => {
            return HttpResponse.json({}, { status: 404 });
          })
        ]
      );
      server.listen();

      const response = await request(app)
        .get(`/snaps`)
        .query({ byFollowed: true })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The username with ID test was not found.',
        instance: '/snaps?byFollowed=true',
        status: 404,
        title: 'username Not Found',
        type: 'about:blank'
      });

      server.close();
    });

    it('should pass the error received by the service on which it depends (case 503)', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'TestUser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User',
          username: 'TestUser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User',
          username: 'TestUser3'
        },
        content: 'Test snap 3'
      });
      await TwitSnap.create({
        user: {
          userId: 4,
          name: 'Test User',
          username: 'TestUser4'
        },
        content: 'Test snap 4'
      });

      const server = setupServer(
        ...[
          http.get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, () => {
            // 500, users service is down
            return HttpResponse.json({}, { status: 500 });
          })
        ]
      );
      server.listen();

      const response = await request(app)
        .get(`/snaps`)
        .query({ byFollowed: true })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        detail: 'The server is not ready to handle the request.',
        instance: '/snaps?byFollowed=true',
        status: 503,
        title: 'Service unavailable',
        type: 'about:blank'
      });

      server.close();
    });

    it('should return an empty array when no snaps exist with said tag', async () => {
      const response = await request(app)
        .get('/snaps')
        .query({ hashtag: 'None' })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });

    it('should return an empty array when no snaps exist with said tag', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Hello! Doing a #Test',
        entities: {
          hashtags: [{ text: '#Test' }]
        }
      });

      const response = await request(app)
        .get('/snaps')
        .query({ hashtag: 'Test' })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Hello! Doing a #Test'
      ]);
    });

    it('should return all snaps with the same tag', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Hello! Doing a #Test 1',
        entities: {
          hashtags: [{ text: '#Test' }]
        }
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Hello! Doing a #Test 2',
        entities: {
          hashtags: [{ text: '#Test' }]
        }
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Hello! Doing a #Test 3',
        entities: {
          hashtags: [{ text: '#Test' }]
        }
      });

      const response = await request(app)
        .get('/snaps')
        .query({ hashtag: 'Test' })
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
        'Hello! Doing a #Test 3',
        'Hello! Doing a #Test 2',
        'Hello! Doing a #Test 1'
      ]);
    });
  });
  describe('GET /snaps/:id', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const createdSnap = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app).get(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: `/snaps/${createdSnap.id}`,
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should return a snap when given a valid ID', async () => {
      const createdSnap = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app)
        .get(`/snaps/${createdSnap.id}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.id).toBe(createdSnap.id);
      expect(response.body.data.content).toBe('Test snap');
    });

    it('should return 404 when given a non-existent ID', async () => {
      const nonExistentId = 'e0462215-9238-4919-a4e0-0be725d7ed57';

      const response = await request(app)
        .get(`/snaps/${nonExistentId}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The Snap with ID e0462215-9238-4919-a4e0-0be725d7ed57 was not found.',
        instance: '/snaps/e0462215-9238-4919-a4e0-0be725d7ed57',
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should return 400 when given an invalid ID format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app)
        .get(`/snaps/${invalidId}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'id',
        detail: 'Invalid UUID',
        instance: '/snaps/invalid-id-format',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });

    it('should return snap with correct structure', async () => {
      const createdSnap = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Detailed snap',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app)
        .get(`/snaps/${createdSnap.id}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);

      const snap = response.body.data;
      expect(snap.id).toBeDefined();
      expect(snap.user.userId).toBeDefined();
      expect(snap.user.name).toBeDefined();
      expect(snap.user.username).toBeDefined();
      expect(typeof snap.id).toBe('string');
      expect(typeof snap.user.userId).toBe('number');
      expect(typeof snap.user.name).toBe('string');
      expect(typeof snap.user.username).toBe('string');
      expect(UUID.isValid(snap.id)).toBe(true);
      expect(snap.content).toBe('Detailed snap');
    });
  });
  describe('DELETE /snaps/:id', () => {
    it('should raise AuthenticationError if no Authorization is specified', async () => {
      const createdSnap = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test snap',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app).delete(`/snaps/${createdSnap.id}`);
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        detail: 'Authentication error.',
        instance: `/snaps/${createdSnap.id}`,
        status: 401,
        title: 'Unauthorized',
        type: 'about:blank'
      });
    });

    it('should delete a snap when given a valid ID', async () => {
      const createdSnap = await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User',
          username: 'testuser'
        },
        content: 'Test twit to delete',
        entities: {
          hashtags: []
        }
      });

      const response = await request(app)
        .delete(`/snaps/${createdSnap.id}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(204);

      const deletedSnap = await TwitSnap.findById(createdSnap.id);
      expect(deletedSnap).toBeNull();
    });

    it('should return 404 when trying to delete a non-existent snap', async () => {
      const nonExistentId = 'e0462215-9238-4919-a4e0-0be725d7ed57';

      const response = await request(app)
        .delete(`/snaps/${nonExistentId}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        detail: 'The Snap with ID e0462215-9238-4919-a4e0-0be725d7ed57 was not found.',
        instance: '/snaps/e0462215-9238-4919-a4e0-0be725d7ed57',
        status: 404,
        title: 'Snap Not Found',
        type: 'about:blank'
      });
    });

    it('should return 400 when given an invalid ID format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app)
        .delete(`/snaps/${invalidId}`)
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        'custom-field': 'id',
        detail: 'Invalid UUID',
        instance: '/snaps/invalid-id-format',
        status: 400,
        title: 'Validation Error',
        type: 'about:blank'
      });
    });
  });
  describe('getTotalAmount', () => {
    it('should return 0 if there are no snaps', async () => {
      const response = await request(app)
        .get('/snaps/amount')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toBe(0);
    });

    it('should return the total amount of snaps', async () => {
      await TwitSnap.create({
        user: {
          userId: 1,
          name: 'Test User 1',
          username: 'testuser1'
        },
        content: 'Test snap 1'
      });
      await TwitSnap.create({
        user: {
          userId: 2,
          name: 'Test User 2',
          username: 'testuser2'
        },
        content: 'Test snap 2'
      });
      await TwitSnap.create({
        user: {
          userId: 3,
          name: 'Test User 3',
          username: 'testuser3'
        },
        content: 'Test snap 3'
      });

      const response = await request(app)
        .get('/snaps/amount')
        .set({
          Authorization: `Bearer ${auth}`
        })
        .expect(200);

      expect(response.body.data).toBe(3);
    });
  });
});
