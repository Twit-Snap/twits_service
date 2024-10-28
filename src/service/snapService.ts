import { SnapRepository } from '../repositories/snapRepository';
import { ISnapService } from '../types/servicesTypes';
import {
  Entities,
  GetAllParams,
  Hashtag,
  RankRequest,
  SnapRankSample,
  SnapResponse,
  TwitUser
} from '../types/types';

export class SnapService implements ISnapService {
  private extractHashTags(content: string): Hashtag[] {
    const hashTags = content.match(/#\w+/g);
    return hashTags ? hashTags.map(tag => ({ text: tag })) : [];
  }

  async createSnap(content: string, user: TwitUser): Promise<SnapResponse> {
    const entities: Entities = {
      hashtags: this.extractHashTags(content)
    };
    const savedSnap: SnapResponse = await new SnapRepository().create(content, user, entities);
    return savedSnap;
  }

  async getAllSnaps(params: GetAllParams) {
    const snaps: SnapResponse[] = await new SnapRepository().findAll(params);
    return snaps;
  }

  async getSnapById(twitId: string): Promise<SnapResponse> {
    const snap: SnapResponse = await new SnapRepository().findById(twitId);
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
