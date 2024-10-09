import { NotFoundError, ValidationError } from '../types/customErrors';
import { SnapResponse, TwitUser, Entities } from '../types/types';
import { UUID } from '../utils/uuid';
import TwitSnap from './models/Snap';

export interface ISnapRepository {
  create(message: string, user: TwitUser, entities: Entities): Promise<SnapResponse>;
  findAll(): Promise<SnapResponse[]>;
  findById(id: string): Promise<SnapResponse>;
  findByHashtag(hashtag: string): Promise<SnapResponse[]>;
  deleteById(id: string): Promise<void>;
  findByUsersIds(usersIds: number[]): Promise<SnapResponse[]>;
  findByUsername(username: string): Promise<SnapResponse[]>;
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

  async findAll(): Promise<SnapResponse[]> {
    const snaps = await TwitSnap.find().sort({ createdAt: -1 });
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
    const snaps = await TwitSnap.find({ 'entities.hashtags.text': `#${hashtag}` }).sort({ createdAt: -1 });
    return snaps.map(snap => ({
      id: snap._id,
      user: snap.user,
      content: snap.content,
      createdAt: snap.createdAt
    }));
  }
  async findByUsersIds(usersIds: number[]): Promise<SnapResponse[]> {
    const snaps = await TwitSnap.find({ 'user.userId': { $in: usersIds } }).sort({ createdAt: -1 });

    return snaps.map(snap => ({
      id: snap._id,
      user: snap.user,
      content: snap.content,
      createdAt: snap.createdAt
    }));
  }

  async findByUsername(username: string): Promise<SnapResponse[]> {
    const snaps = await TwitSnap.find({ 'user.username': { $in: username  } }).sort({ createdAt: -1 });
    return snaps.map(snap => ({
      id: snap._id,
      user: snap.user,
      content: snap.content,
      createdAt: snap.createdAt
    }));
  }
}
