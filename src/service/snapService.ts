import { ValidationError } from '../types/customErrors';

export interface ISnapService {
  validateUsersIds(usersIds: number[]): void;
}

export class SnapService implements ISnapService {
  validateUsersIds(usersIds: number[]): void {
    if (!usersIds) {
      throw new ValidationError('usersId', 'Users IDs required!');
    }

    if (!Array.isArray(usersIds)) {
      throw new ValidationError('usersId', 'Users IDs must be an array of IDs!');
    }
  }
}
