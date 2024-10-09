import { NotFoundError } from '../types/customErrors';
import { LikeResponse } from '../types/types';
import Like from './models/Like';

export interface ILikeRepository {
  add(userId: number, twitId: string): Promise<LikeResponse>;
  remove(userId: number, twitId: string): Promise<void>;
  getLikesByTwit(twitId: string): Promise<number>;
}

export class LikeRepository implements ILikeRepository {
  async add(userId: number, twitId: string): Promise<LikeResponse> {
    const like = new Like({
      userId: userId,
      twitId: twitId,
      createdAt: new Date().toISOString()
    });

    const savedLike = await like.save();

    return {
      userId: savedLike.userId as number,
      twitId: savedLike.twitId,
      createdAt: savedLike.createdAt
    };
  }

  async remove(userId: number, twitId: string): Promise<void> {
    const result = await Like.deleteOne({ userId: userId, twitId: twitId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Like', `(user, twit) ; (${userId}, ${twitId})`);
    }
  }

  async getLikesByTwit(twitId: string): Promise<number> {
    const result = await Like.countDocuments({ twitId: twitId });

    return result;
  }
}
