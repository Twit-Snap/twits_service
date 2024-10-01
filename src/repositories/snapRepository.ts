import { SnapResponse, TwitUser } from '../types/types';
import { NotFoundError, ValidationError } from '../types/customErrors';
import TwitSnap from './models/Snap';
import { UUID } from '../utils/uuid';

export interface ISnapRepository {
  create(message: string, user: TwitUser): Promise<SnapResponse>;
  findAll(): Promise<SnapResponse[]>;
  findById(id: string): Promise<SnapResponse>;
  deleteById(id: string): Promise<void>;
}

export class SnapRepository implements ISnapRepository {
  async create(content: string, user: TwitUser): Promise<SnapResponse> {
    const snap = new TwitSnap({
      _id: UUID.generate(),
      content,
      user,
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
}
