import { RootFilterQuery } from 'mongoose';
import { NotFoundError, ValidationError } from '../types/customErrors';
import { Entities, GetAllParams, SnapResponse, TwitUser } from '../types/types';
import { UUID } from '../utils/uuid';
import TwitSnap, { ISnapModel } from './models/Snap';

export interface ISnapRepository {
  findAll(params: GetAllParams): Promise<SnapResponse[]>;
  create(message: string, user: TwitUser, entities: Entities): Promise<SnapResponse>;
  findById(id: string): Promise<SnapResponse>;
  findByHashtag(hashtag: string): Promise<SnapResponse[]>;
  deleteById(id: string): Promise<void>;
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

    if (params.createdAt) {
      filter = {
        ...filter,
        createdAt: params.older ? { $lt: params.createdAt } : { $gt: params.createdAt }
      };
    }

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

    const snaps = await TwitSnap.find(filter)
      .sort({ createdAt: -1 })
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

  async findByHashtag(hashtag: string): Promise<SnapResponse[]> {
    const snaps = await TwitSnap.find({ 'entities.hashtags.text': `#${hashtag}` }).sort({
      createdAt: -1
    });
    return snaps.map(snap => ({
      id: snap._id,
      user: snap.user,
      content: snap.content,
      createdAt: snap.createdAt
    }));
  }
}
