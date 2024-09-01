import { SnapResponse } from '../types/types';
import { NotFoundError, ValidationError } from '../customErrors';
import Snap from './models/Snap';
import { UUID } from '../utils/uuid';

export interface ISnapRepository {
  create(message: string): Promise<SnapResponse>;
  findAll(): Promise<SnapResponse[]>;
  findById(id: string): Promise<SnapResponse>;
  deleteById(id: string): Promise<void>;
}

export class SnapRepository implements ISnapRepository {
  async create(message: string): Promise<SnapResponse> {
    const snap = new Snap({ _id: UUID.generate(), message });
    const savedSnap = await snap.save();
    return {
      id: savedSnap._id,
      message: savedSnap.message
    };
  }

  async findAll(): Promise<SnapResponse[]> {
    const snaps = await Snap.find().sort({ createdAt: -1 });
    return snaps.map(snap => ({
      id: snap._id,
      message: snap.message
    }));
  }

  async findById(id: string): Promise<SnapResponse> {
    if (!UUID.isValid(id)) {
      throw new ValidationError('id', 'Invalid UUID');
    }
    const snap = await Snap.findById(id);
    if (!snap) {
      throw new NotFoundError('Snap', id);
    }
    return {
      id: snap._id,
      message: snap.message
    };
  }

  async deleteById(id: string): Promise<void> {
    if (!UUID.isValid(id)) {
      throw new ValidationError('id', 'Invalid UUID');
    }
    const result = await Snap.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Snap', id);
    }
  }
}
