import { GetAllParams, GetByIdParams, LikeResponse, BookmarkResponse, SnapBody, SnapResponse, UserMention } from './types';

export interface ISnapService {
  createSnap(snapBody: SnapBody, userMentions: UserMention[]): Promise<SnapResponse>;
  getAllSnaps(params: GetAllParams): Promise<SnapResponse[]>;
  getSnapById(twitId: string, params?: GetByIdParams): Promise<SnapResponse>;
}

export interface ILikeService {
  getLikesByTwit(twitId: string): Promise<number>;
  addLike(userId: number, twitId: string): Promise<LikeResponse>;
  removeLike(userId: number, twitId: string): Promise<void>;
  getLikesByUser(userId: number): Promise<SnapResponse[]>;
  addLikeInteractions(userId: number, twits: SnapResponse[]): Promise<SnapResponse[]>;
}

export interface IBookmarkService {
  getBookmarksByTwit(twitId: string): Promise<number>;
  addBookmark(userId: number, twitId: string): Promise<BookmarkResponse>;
  removeBookmark(userId: number, twitId: string): Promise<void>;
  getBookmarksByUser(userId: number): Promise<SnapResponse[]>;
  addBookmarkInteractions(userId: number, twits: SnapResponse[]): Promise<SnapResponse[]>;
}
