export type SnapResponse = {
  id: string;
  message: string;
};

export type CreateSnapBody = {
  message: string;
};



// poc model


export interface Tweet {
  _id: string;
  createdAt: string;
  text: string;
  favoriteCount: number;
  retweetCount: number;
  entities: Entities;
  inReplyToTweetId: string | null;
  inReplyToUserId: string | null;
  lang: string;
  user: UserTweet;
  userId: number;
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

export interface UserTweet {
  id: number;
  name: string;
  username: string;
  imageUrl: string;
  verified: boolean;
}
