export interface TwitUser {
  userId: number;
  name: string;
  username: string;
  isPrivate?: boolean;
  following?: boolean; // Auth user is following the requested user?
  followed?: boolean; // Auth user is followed by the requested user?
  //profileImageUrl: string;
  //verified: boolean;
}

export type RankRequest = {
  data: { id: string; content: string }[];
  limit: number;
};

export type SnapRank = {
  ranking: {
    data: { id: string; content: string }[];
  };
};

export type SnapRankSample = {
  data: { id: string; content: string }[];
};

export type GetAllParams = {
  older: boolean;
  byFollowed: boolean;
  noJoinParent?: boolean;
  followedIds?: number[];
  limit?: number;
  offset?: number;
  createdAt?: string;
  has?: string;
  username?: string;
  hashtag?: string;
  rank?: string;
  exactDate?: boolean;
  withEntities?: boolean;
};

export type GetByIdParams = {
  withEntities?: boolean;
  noJoinParent?: boolean;
};

export type SnapResponse = {
  id: string;
  user: TwitUser;
  content: string;
  createdAt: string;
  likesCount?: number;
  userLiked?: boolean;
  entities?: Entities;
};

export type LikeResponse = {
  userId: number;
  twitId: string;
  createdAt: string;
};

export type SnapBody = {
  content: string;
  user: TwitUser;
  type: string;
  parent: string;
  entities?: Entities;
};

export interface TwitSnap {
  _id: string;
  createdAt: string;
  user: TwitUser;
  content: string;
  entities: Entities;
  //inReplyToTweetId: string | null;
  //inReplyToUserId: string | null;
  //lang: string;
  //favoriteCount: number;
  //retweetCount: number;
}

export interface Entities {
  hashtags: Hashtag[];
  //userMentions: UserMention[];
  //urls: URL[];
}

export interface Hashtag {
  text: string;
}

export interface URL {
  url: string;
  indices: number[];
}

export interface UserMention {
  id: number;
  username: string;
  indices: number[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  lastname: string;
  birthdate: Date;
  createdAt: Date;
}
