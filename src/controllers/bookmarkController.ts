import { NextFunction, Request, Response } from 'express';
import { BookmarkService } from '../service/bookmarkService';
import { IBookmarkController } from '../types/controllerTypes';
import { ValidationError } from '../types/customErrors';
import { UUID } from '../utils/uuid';

export class BookmarkController implements IBookmarkController {
  validateTwitId(twitId: string | undefined): string {
    if (!twitId) {
      throw new ValidationError('twitId', 'Twit ID required!');
    }

    if (!UUID.isValid(twitId)) {
      throw new ValidationError('twitId', 'Invalid UUID');
    }

    return twitId;
  }
}

export const getBookmarksByTwit = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let twitId = req.params.twitId;

    twitId = new BookmarkController().validateTwitId(twitId);

    const data = await new BookmarkService().getBookmarksByTwit(twitId);

    res.status(200).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const addBookmark = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let twitId: string | undefined = req.body.twitId;

    twitId = new BookmarkController().validateTwitId(twitId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    const data = await new BookmarkService().addBookmark(user.userId, twitId);

    res.status(201).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const removeBookmark = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let twitId = req.body.twitId;

    twitId = new BookmarkController().validateTwitId(twitId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    await new BookmarkService().removeBookmark(user.userId, twitId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
