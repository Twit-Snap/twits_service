import { ValidationError } from '../types/customErrors';
import { UUID } from '../utils/uuid';

export interface ILikeService {
  validateTwitId(twitId: string): void;
  validateUserId(userId: string): void;
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

  validateUserId(userId: string) {
    if (!userId || userId === '') {
      throw new ValidationError('userId', 'User ID required!');
    }

    // Not numeric string check
    if (isNaN(+userId)) {
      throw new ValidationError('userId', 'Invalid user ID, must be a number');
    }
  }
}
