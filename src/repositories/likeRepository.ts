import { NotFoundError } from '../types/customErrors';
import { LikeResponse, SnapResponse } from '../types/types';
import Like from './models/Like';
import { ISnapModel } from './models/Snap';

export interface ILikeRepository {
  add(userId: number, twitId: string): Promise<LikeResponse>;
  remove(userId: number, twitId: string): Promise<void>;
  getLikesByTwit(twitId: string): Promise<number>;
  getLikesByUser(userId: number): Promise<SnapResponse[]>;
  getUserLikedTwit(userId: number, twitId: string): Promise<boolean>;
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

  async getUserLikedTwit(userId: number, twitId: string): Promise<boolean> {
    const result = await Like.findOne({ twitId: twitId, userId: userId });

    return result ? true : false;
  }

  async getLikesByUser(userId: number): Promise<SnapResponse[]> {
    const likes = await Like.find({ userId: userId }).sort({ createdAt: -1 }).populate('twitId');

    const expandedLikes: SnapResponse[] = likes.map(like => {
      const twit: ISnapModel = like.twitId as unknown as ISnapModel;

      return {
        id: twit._id,
        user: twit.user,
        content: twit.content,
        createdAt: twit.createdAt,
        privacy: twit.privacy
      };
    });

    return expandedLikes;
  }
}
