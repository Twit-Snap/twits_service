import { JwtUserPayload } from './jwt';

export interface ILikeController {
  validateTwitId(twitId: string | undefined): string;
}

export interface ITwitController {
  validateContent(content: string | undefined): string;
  getFollowedIds(user: JwtUserPayload): Promise<number[]>;
}
