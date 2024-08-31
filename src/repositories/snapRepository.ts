import Snap, { ISnapModel } from './models/Snap';
import { SnapResponse } from '../types/types';

export interface ISnapRepository {
  create(message: string): Promise<SnapResponse>;
  findAll(): Promise<SnapResponse[]>;
}

export class SnapRepository implements ISnapRepository {
  async create(message: string): Promise<SnapResponse> {
    const snap = new Snap({ message });
    const savedSnap = await snap.save();
    return {
      id: savedSnap.id,
      message: savedSnap.message
    };
  }

  async findAll(): Promise<SnapResponse[]> {
    const snaps = await Snap.find().sort({ createdAt: -1 });
    return snaps.map(snap => ({
      id: snap.id,
      message: snap.message
    }));
  }
}