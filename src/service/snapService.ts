import { SnapRepository } from '../repositories/snapRepository';
import { EntityAlreadyExistsError } from '../types/customErrors';
import { ISnapService } from '../types/servicesTypes';
import {
  Entities,
  GetAllParams,
  GetByIdParams,
  Hashtag,
  ModifiableSnapBody,
  RankRequest,
  SnapBody,
  SnapRankSample,
  SnapResponse,
  UserMention
} from '../types/types';
import { BookmarkService } from './bookmarkService';
import { LikeService } from './likeService';

export class SnapService implements ISnapService {

  extractHashTags(content: string): Hashtag[] {
    const hashTags = content.match(/#\w+/g);
    return hashTags ? hashTags.map(tag => ({ text: tag })) : [];
  }

  extractMentions(content: string): UserMention[] {
    const mentions = content.match(/@\w+/g);
    return mentions ? mentions.map(username => ({ username: username.slice(1) })) : [];
  }

  private async validateParent(parent: string | undefined) {
    if (!parent) {
      return;
    }

    await this.getSnapById(parent); // repository validation
  }

  async createSnap(snapBody: SnapBody, userMentions: UserMention[], hashtags: Hashtag[]): Promise<SnapResponse> {
    await this.validateParent(snapBody.parent);

    const entities: Entities = {
      hashtags,
      userMentions
    };

    const repository = new SnapRepository();

    if (snapBody.type === 'retwit') {
      await repository
        .userRetwittedTwit(snapBody.user.userId, snapBody.parent)
        .then(alreadyRetwitted => {
          if (alreadyRetwitted) {
            throw new EntityAlreadyExistsError(
              'twit',
              `You already retwitted ${snapBody.parent} already exist`
            );
          }
        });
    }

    const savedSnap: SnapResponse = await repository.create({ ...snapBody, entities });
    return savedSnap;
  }

  async addInteractions(userId: number, snaps: SnapResponse[]): Promise<SnapResponse[]> {
    snaps = await new LikeService().addLikeInteractions(userId, snaps);
    snaps = await new BookmarkService().addBookmarkInteractions(userId, snaps);
    snaps = await this.addCommentInteractions(snaps);
    snaps = await this.addRetwitInteractions(userId, snaps);
    return snaps;
  }

  async addCommentInteractions(snaps: SnapResponse[]) {
    const retwitsPerTwit = await new SnapRepository().getCommentsPerTwit(
      snaps.map(twit =>
        twit.type === 'retwit' ? (twit.parent as unknown as SnapResponse).id : twit.id
      )
    );

    return await Promise.all(
      snaps.map(async twit => {
        const twitId =
          twit.type === 'retwit' ? (twit.parent as unknown as SnapResponse).id : twit.id;
        return {
          ...twit,
          commentCount: retwitsPerTwit.get(twitId) || 0
        };
      })
    );
  }

  async addRetwitInteractions(userId: number, snaps: SnapResponse[]) {
    const retwitsPerTwit = await new SnapRepository().getRetwitsPerTwit(
      snaps.map(twit =>
        twit.type === 'retwit' ? (twit.parent as unknown as SnapResponse).id : twit.id
      )
    );

    return await Promise.all(
      snaps
        .filter(twit =>
          twit.type === 'retwit' ? userId === twit.user.userId || twit.user.following : true
        )
        .map(async twit => {
          const twitId =
            twit.type === 'retwit' ? (twit.parent as unknown as SnapResponse).id : twit.id;
          return {
            ...twit,
            userRetwitted: await new SnapRepository().userRetwittedTwit(userId, twitId),
            retwitCount: retwitsPerTwit.get(twitId) || 0
          };
        })
    );
  }

  async deleteRetwit(parentId: string, userId: number) {
    await new SnapRepository().deleteRetwit(parentId, userId);
  }

  async getAllSnaps(params: GetAllParams) {
    const snaps: SnapResponse[] = await new SnapRepository().findAll(params);
    return snaps;
  }

  async getSnapById(twitId: string, params?: GetByIdParams): Promise<SnapResponse> {
    const snap: SnapResponse = await new SnapRepository().findById(twitId, params);
    return snap;
  }

  async deleteSnapById(twitId: string): Promise<void> {
    await new SnapRepository().deleteById(twitId);
  }

  async getTotalAmount(params: GetAllParams): Promise<number> {
    return await new SnapRepository().totalAmount(params);
  }

  async loadSnapsToFeedAlgorithm(): Promise<RankRequest> {
    return await new SnapRepository().loadSnapsToFeedAlgorithm();
  }

  async getSnapSample(userId: number): Promise<SnapRankSample> {
    return await new SnapRepository().getSample(userId);
  }

  async editSnapById(
    twitId: string,
    modifiable: ModifiableSnapBody,
    userMentions: UserMention[]
  ): Promise<SnapResponse> {
    if (modifiable.content) {
      modifiable.entities = {
        hashtags: this.extractHashTags(modifiable.content),
        userMentions
      };
    }

    const snap: SnapResponse = await new SnapRepository().editById(twitId, modifiable);
    return snap;
  }
}
