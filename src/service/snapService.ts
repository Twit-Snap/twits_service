import { SnapRepository } from '../repositories/snapRepository';
import { EntityAlreadyExistsError } from '../types/customErrors';
import { ISnapService } from '../types/servicesTypes';
import {
  Entities,
  GetAllParams,
  GetByIdParams,
  Hashtag,
  RankRequest,
  SnapBody,
  SnapRankSample,
  SnapResponse
} from '../types/types';

export class SnapService implements ISnapService {
  private extractHashTags(content: string): Hashtag[] {
    const hashTags = content.match(/#\w+/g);
    return hashTags ? hashTags.map(tag => ({ text: tag })) : [];
  }

  private validateParent(parent: string | undefined) {
    if (!parent) {
      return;
    }

    this.getSnapById(parent); // repository validation
  }

  async createSnap(snapBody: SnapBody): Promise<SnapResponse> {
    this.validateParent(snapBody.parent);

    const entities: Entities = {
      hashtags: this.extractHashTags(snapBody.content)
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

  async editSnapById(twitId: string, content: string): Promise<SnapResponse> {
    const entities: Entities = {
      hashtags: this.extractHashTags(content)
    };
    const snap: SnapResponse = await new SnapRepository().editById(twitId, content, entities);
    return snap;
  }
}
