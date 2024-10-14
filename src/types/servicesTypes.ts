import { LikeResponse, SnapResponse, TwitUser } from "./types";

export interface ISnapService {
  createSnap(content: string, user: TwitUser): Promise<SnapResponse>;
  getAllSnaps(
    userId: number,
    createdAt: string | undefined,
    limit: number | undefined,
    older: boolean,
    has: string
  ): Promise<SnapResponse[]>;
  getSnapById(twitId: string): Promise<SnapResponse>;
  deleteSnapById(twitId: string): Promise<void>;
  getSnapsByHashtag(hashtag: string): Promise<SnapResponse[]>;
  getSnapsByUsersIds(
    usersIds: number[],
    createdAt: string | undefined,
    limit: number | undefined,
    older: boolean
  ): Promise<SnapResponse[]>;
  getSnapsByUsername(
    username: string,
    createdAt: string | undefined,
    limit: number | undefined,
    older: boolean
  ): Promise<SnapResponse[]>;
}

export interface ILikeService {
  getLikesByTwit(twitId: string): Promise<number>;
  addLike(userId: number, twitId: string): Promise<LikeResponse>;
  removeLike(userId: number, twitId: string): Promise<void>;
  getLikesByUser(userId: number): Promise<SnapResponse[]>;
  addLikeInteractions(userId: number, twits: SnapResponse[]): Promise<SnapResponse[]>;
}
