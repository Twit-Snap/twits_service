import { JwtUserPayload } from '../../types/jwt';
import { SnapResponse } from '../../types/types';

export const removePrivateSnaps = (user: JwtUserPayload, snaps: SnapResponse[]): SnapResponse[] => {
  return snaps.filter(
    snap =>
      snap.privacy === 'Everyone' ||
      (snap.privacy === 'Only Followers' &&
        (snap.user.followed || snap.user.userId === user.userId))
  );
};
