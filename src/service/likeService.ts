import { LikeRepository } from '../repositories/likeRepository';
import { SnapRepository } from '../repositories/snapRepository';
import { ILikeService } from '../types/servicesTypes';
import { LikeResponse, SnapResponse } from '../types/types';

export class LikeService implements ILikeService {
  async getLikesByTwit(twitId: string): Promise<number> {
    //Twit exist?
    await new SnapRepository().findById(twitId);

    const data = await new LikeRepository().getLikesByTwit(twitId);

    return data;
  }

  async addLike(userId: number, twitId: string): Promise<LikeResponse> {
    //Twit exist?
    await new SnapRepository().findById(twitId);

    const data = await new LikeRepository().add(userId, twitId);

    return data;
  }

  async removeLike(userId: number, twitId: string): Promise<void> {
    //Twit exist?
    await new SnapRepository().findById(twitId);

    await new LikeRepository().remove(userId, twitId);
  }

  async getLikesByUser(userId: number): Promise<SnapResponse[]> {
    const data = await new LikeRepository().getLikesByUser(userId);
    return data;
  }

  async addLikeInteractions(userId: number, twits: SnapResponse[]): Promise<SnapResponse[]> {
    return await Promise.all(
      twits.map(async twit => {
        const userCanViewCount =
          !twit.user.isPrivate ||
          userId === twit.user.userId || (twit.user.following && twit.user.followed);

        return {
          ...twit,
          userLiked: await new LikeRepository().getUserLikedTwit(userId, twit.id),
          likesCount: userCanViewCount
            ? await new LikeRepository().getLikesByTwit(twit.id)
            : undefined
        };
      })
    );
  }
}
