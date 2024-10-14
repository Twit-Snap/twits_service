import { NextFunction, Request, Response } from 'express';
import { SnapService } from '../service/snapService';
import { ITwitController } from '../types/controllerTypes';
import { ValidationError } from '../types/customErrors';
import { CreateSnapBody, SnapResponse, TwitUser } from '../types/types';
import { LikeController } from './likeController';

export class TwitController implements ITwitController {
  validateContent(content: string | undefined): string {
    if (!content) {
      throw new ValidationError('content', 'The TwitSnap content is required.');
    }
    if (content.length > 280) {
      throw new ValidationError(
        content,
        'The content of the TwitSnap must not exceed 280 characters.'
      );
    }

    return content;
  }

  validateUsername(username: string | undefined): string {
    if (!username) {
      throw new ValidationError('username', 'Username required!');
    }
    return username;
  }

  validateUsersIds(usersIds: number[] | undefined): number[] {
    if (!usersIds) {
      throw new ValidationError('usersId', 'Users IDs required!');
    }

    if (!Array.isArray(usersIds)) {
      throw new ValidationError('usersId', 'Users IDs must be an array of IDs!');
    }

    return usersIds;
  }
}

export const createSnap = async (
  req: Request<{}, {}, CreateSnapBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    let content: string | undefined = req.body.content;

    content = new TwitController().validateContent(content);

    const user: TwitUser = {
      userId: req.body.authorId,
      name: req.body.authorName,
      username: req.body.authorUsername
    };

    const savedSnap: SnapResponse = await new SnapService().createSnap(content, user);
    res.status(201).json({ data: savedSnap });
  } catch (error) {
    next(error);
  }
};

export const getAllSnaps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const createdAt: string | undefined = req.query.createdAt?.toString();
    const limit: number | undefined = req.query.limit ? +req.query.limit.toString() : undefined;
    const older: boolean = req.query.older === 'true' ? true : false;
    const has: string = req.query.has ? req.query.has.toString() : '';

    const user = (req as any).user;

    new LikeController().validateUserId(user.userId);

    const snaps: SnapResponse[] = await new SnapService().getAllSnaps(
      user.userId,
      createdAt,
      limit,
      older,
      has
    );
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};

export const getSnapById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const snap: SnapResponse = await new SnapService().getSnapById(id);
    res.status(200).json({ data: snap });
  } catch (error) {
    next(error);
  }
};

export const deleteSnapById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await new SnapService().deleteSnapById(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getSnapsByHashtag = async (
  req: Request<{ hashtag: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { hashtag } = req.params;
    const snaps: SnapResponse[] = await new SnapService().getSnapsByHashtag(hashtag);
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};

export const getSnapsByUsersIds = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { usersIds } = req.body;

    const createdAt: string | undefined = req.query.createdAt?.toString();
    const limit: number | undefined = req.query.limit ? +req.query.limit.toString() : undefined;
    const older: boolean = req.query.older === 'true' ? true : false;

    new TwitController().validateUsersIds(usersIds);

    const snaps: SnapResponse[] = await new SnapService().getSnapsByUsersIds(
      usersIds,
      createdAt,
      limit,
      older
    );
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};

export const getSnapsByUsername = async (
  req: Request<{ username: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let username = req.params.username;

    username = new TwitController().validateUsername(username);

    const createdAt: string | undefined = req.query.createdAt?.toString();
    const limit: number | undefined = req.query.limit ? +req.query.limit.toString() : undefined;
    const older: boolean = req.query.older === 'true' ? true : false;

    const snaps: SnapResponse[] = await new SnapService().getSnapsByUsername(
      username,
      createdAt,
      limit,
      older
    );
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};
