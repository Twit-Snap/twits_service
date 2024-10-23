import { GetAllParams, LikeResponse, SnapResponse, TwitUser } from './types';

export interface ISnapService {
  createSnap(content: string, user: TwitUser): Promise<SnapResponse>;
  getAllSnaps(params: GetAllParams): Promise<SnapResponse[]>;
  getSnapById(twitId: string): Promise<SnapResponse>;
  deleteSnapById(twitId: string): Promise<void>;
  getTotalAmount(params: GetAllParams): Promise<number>;
}

export interface ILikeService {
  getLikesByTwit(twitId: string): Promise<number>;
  addLike(userId: number, twitId: string): Promise<LikeResponse>;
  removeLike(userId: number, twitId: string): Promise<void>;
  getLikesByUser(userId: number): Promise<SnapResponse[]>;
  addLikeInteractions(userId: number, twits: SnapResponse[]): Promise<SnapResponse[]>;
}
