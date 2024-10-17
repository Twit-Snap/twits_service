import { SnapRepository } from '../repositories/snapRepository';
import { ISnapService } from '../types/servicesTypes';
import { Entities, GetAllParams, Hashtag, SnapResponse, TwitUser } from '../types/types';
import { LikeService } from './likeService';

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

  async getAllSnaps(userId: number, params: GetAllParams) {
    const snaps: SnapResponse[] = await new SnapRepository().findAll(params);
    const snapsInteractions = await new LikeService().addLikeInteractions(userId, snaps);

    return snapsInteractions;
  }

  async getSnapById(twitId: string): Promise<SnapResponse> {
    const snap: SnapResponse = await new SnapRepository().findById(twitId);
    return snap;
  }

  async deleteSnapById(twitId: string): Promise<void> {
    await new SnapRepository().deleteById(twitId);
  }
}
