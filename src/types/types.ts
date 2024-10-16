export interface TwitUser {
  userId: number;
  name: string;
  username: string;
  //profileImageUrl: string;
  //verified: boolean;
}

export type GetAllParams = {
  older: boolean;
  byFollowed: boolean;
  followedIds?: number[];
  limit?: number;
  createdAt?: string;
  has?: string;
  username?: string;
};

export type SnapResponse = {
  id: string;
  user: TwitUser;
  content: string;
  createdAt: string;
  likesCount?: number;
  userLiked?: boolean;
};

export type LikeResponse = {
  userId: number;
  twitId: string;
  createdAt: string;
};

export type CreateSnapBody = {
  content: string;
  authorId: number;
  authorName: string;
  authorUsername: string;
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
