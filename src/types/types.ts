export interface TwitUser {
  userId: number;
  name: string;
  username: string;
  //profileImageUrl: string;
  //verified: boolean;
}

export type SnapResponse = {
  id: string;
  user: TwitUser;
  content: string;
  createdAt: string;
};

export type CreateSnapBody = {
  content: string;
  authorId: number;
  authorName: string;
  authorUsername: string;
};

export interface TwitSnap {
  id: string;
  createdAt: string;
  user: TwitUser;
  content: string;
  //entities: Entities;
  //inReplyToTweetId: string | null;
  //inReplyToUserId: string | null;
  //lang: string;
  //favoriteCount: number;
  //retweetCount: number;
}

export interface Entities {
  hashtags: Hashtag[];
  userMentions: UserMention[];
  urls: URL[];
}

export interface Hashtag {
  text: string;
  indices: number[];
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
