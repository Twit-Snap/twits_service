import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import TwitSnap from '../repositories/models/Snap';
import { JWTService } from '../service/jwtService';
import { SnapResponse } from '../types/types';

const auth = new JWTService().sign({
  type: 'user',
  email: 'test@test.com',
  userId: 1,
  username: 'test'
});

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

  describe('GET /hashtag/:hashtag', () => {
    it('should return an empty array when no snaps exist with said tag', async () => {
      const response = await request(app)
        .get('/hashtags/None')
        .set({
          Authorization: `Bearer ${auth}`
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });
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

    const response = await request(app).get('/hashtags/Test').set({
      Authorization: `Bearer ${auth}`
    });;
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

    const response = await request(app).get('/hashtags/Test').set({
      Authorization: `Bearer ${auth}`
    });;
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data.map((snap: SnapResponse) => snap.content)).toEqual([
      'Hello! Doing a #Test 3',
      'Hello! Doing a #Test 2',
      'Hello! Doing a #Test 1'
    ]);
  });
});
