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
  created_at: string;
  entities: Entities;
  favorite_count: number;
  in_reply_to_status_id: string | null;
  in_reply_to_user_id: string | null;
  lang: string;
  retweet_count: number;
  text: string;
  user: UserTweet;
  user_id: number;
}

export interface Entities {
  hashtags: Hashtag[];
  user_mentions: UserMention[];
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
  verified: boolean;
}
