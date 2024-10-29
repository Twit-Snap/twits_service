import { RootFilterQuery } from 'mongoose';
import { NotFoundError, ValidationError } from '../types/customErrors';
import {
  Entities,
  GetAllParams,
  RankRequest,
  SnapRankSample,
  SnapResponse,
  TwitUser
} from '../types/types';
import { UUID } from '../utils/uuid';
import { LikeRepository } from './likeRepository';
import TwitSnap, { ISnapModel } from './models/Snap';

export interface ISnapRepository {
  findAll(params: GetAllParams): Promise<SnapResponse[]>;
  create(message: string, user: TwitUser, entities: Entities): Promise<SnapResponse>;
  findById(id: string): Promise<SnapResponse>;
  deleteById(id: string): Promise<void>;
  totalAmount(params: GetAllParams): Promise<number>;
  loadSnapsToFeedAlgorithm(): Promise<RankRequest>;
}

export class SnapRepository implements ISnapRepository {
  async create(content: string, user: TwitUser, entities: Entities): Promise<SnapResponse> {
    const snap = new TwitSnap({
      _id: UUID.generate(),
      content,
      user,
      entities,
      createdAt: new Date().toISOString()
    });
    const savedSnap = await snap.save();
    return {
      id: savedSnap.id,
      user: savedSnap.user,
      content: savedSnap.content,
      createdAt: savedSnap.createdAt
    };
  }

  async findAll(params: GetAllParams): Promise<SnapResponse[]> {
    var filter: RootFilterQuery<ISnapModel> = { content: { $regex: params.has, $options: 'miu' } };

    filter = this.filterSnapByDate(params, filter);

    if (params.username) {
      filter = {
        ...filter,
        'user.username': { $in: params.username }
      };
    }

    if (params.followedIds) {
      filter = {
        ...filter,
        'user.userId': { $in: params.followedIds }
      };
    }

    if (params.hashtag) {
      filter = {
        ...filter,
        'entities.hashtags.text': `#${params.hashtag}`
      };
    }

    const snaps = await TwitSnap.find(filter)
      .sort({ createdAt: -1 })
      .skip(params.offset ? params.offset : 0)
      .limit(params.limit ? params.limit : 20);

    return snaps.map(snap => ({
      id: snap._id,
      user: snap.user,
      content: snap.content,
      createdAt: snap.createdAt
    }));
  }

  async findById(id: string): Promise<SnapResponse> {
    if (!UUID.isValid(id)) {
      throw new ValidationError('id', 'Invalid UUID');
    }
    const snap = await TwitSnap.findById(id);
    if (!snap) {
      throw new NotFoundError('Snap', id);
    }
    return {
      id: snap._id,
      user: snap.user,
      content: snap.content,
      createdAt: snap.createdAt
    };
  }

  async deleteById(id: string): Promise<void> {
    if (!UUID.isValid(id)) {
      throw new ValidationError('id', 'Invalid UUID');
    }
    const result = await TwitSnap.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Snap', id);
    }
  }

  private filterSnapByDate(params: GetAllParams, filter: RootFilterQuery<ISnapModel>) {
      if (params.createdAt) {
        if (params.exactDate) {
          const year = params.createdAt.substring(0, 4);
          const month = params.createdAt.substring(5, 7).padStart(2, '0');
          const day = params.createdAt.substring(8, 10).padStart(2, '0');

          const nextMoth = (parseInt(month) % 12 + 1).toString().padStart(2, '0');
          const nextYear = (parseInt(month) === 12 ? (parseInt(year) + 1).toString() : year);

          if (params.createdAt.length === 4) {
            filter = {
              ...filter,
              createdAt: { $gte: `${year}-01-01T00:00:00.000Z`, $lt: `${parseInt(year) + 1}-01-01T00:00:00.000Z` }
            };
          } else if (params.createdAt.length === 7) {
            filter = {
              ...filter,
              createdAt: {
                $gte: `${year}-${month}-01T00:00:00.000Z`,
                $lt: `${nextYear}-${nextMoth}-01T00:00:00.000Z`
              }
            };
          } else if (params.createdAt.length >= 10) {
            filter = {
              ...filter,
              createdAt: {
                $gte: `${year}-${month}-${day}T00:00:00.000Z`,
                $lt: `${nextYear}-${month}-${(parseInt(day) + 1).toString().padStart(2, '0')}T00:00:00.000Z`
              }
            };
          }
        } else {
          filter = {
            ...filter,
            createdAt: params.older ? { $lt: params.createdAt } : { $gt: params.createdAt }
          };
        }
      }
      return filter;
  }



  async totalAmount(params: GetAllParams): Promise<number> {
    var filter: RootFilterQuery<ISnapModel> = { content: { $regex: params.has, $options: 'miu' } };

    filter = this.filterSnapByDate(params, filter);

    if (params.username) {
      filter = {
        ...filter,
        'user.username': { $in: params.username }
      };
    }

    const result = await TwitSnap.countDocuments(filter);

    return result;
  }

  async loadSnapsToFeedAlgorithm(): Promise<RankRequest> {
    // Loads all snaps to feed algorithm
    return {
      data: (await TwitSnap.find({}).exec()).map((snap: ISnapModel) => ({
        id: snap._id,
        content: snap.content
      })),
      limit: 1000
    };
  }

  async getSample(userId: number): Promise<SnapRankSample> {
    //Returns a sample of snaps from a user
    //The sample is composed of:
    //Last 15 snaps from the user
    //Last 15 snaps liked by the user
    const user_snaps = await TwitSnap.find({ 'user.userId': userId })
      .sort({ createdAt: -1 })
      .limit(15);
    const user_liked_snaps = (await new LikeRepository().getLikesByUser(userId)).slice(0, 15);
    const sample = [
      ...user_snaps.map(snap => ({
        id: snap._id,
        content: snap.content
      })),
      ...user_liked_snaps.map(snap => ({
        id: snap.id,
        content: snap.content
      }))
    ];
    return { data: sample };
  }
}
