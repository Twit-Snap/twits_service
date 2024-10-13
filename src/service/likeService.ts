import { ValidationError } from '../types/customErrors';
import { UUID } from '../utils/uuid';

export interface ILikeService {
  validateTwitId(twitId: string): void;
  validateUserId(userId: number): void;
}

export class LikeService implements ILikeService {
  validateTwitId(twitId: string) {
    if (!twitId) {
      throw new ValidationError('twitId', 'Twit ID required!');
    }

    if (!UUID.isValid(twitId)) {
      throw new ValidationError('twitId', 'Invalid UUID');
    }
  }

  validateUserId(userId: number) {
    if (!userId) {
      throw new ValidationError('userId', 'User ID required!');
    }
  }
}
