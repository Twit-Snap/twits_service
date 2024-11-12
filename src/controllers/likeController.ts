import { NextFunction, Request, Response } from 'express';
import { LikeService } from '../service/likeService';
import { ILikeController } from '../types/controllerTypes';
import { ValidationError } from '../types/customErrors';
import { UUID } from '../utils/uuid';
import { MetricController } from './metricController';

export class LikeController implements ILikeController {
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

export const getLikesByTwit = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let twitId = req.params.twitId;

    twitId = new LikeController().validateTwitId(twitId);

    const data = await new LikeService().getLikesByTwit(twitId);

    res.status(200).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const addLike = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let twitId: string | undefined = req.body.twitId;

    twitId = new LikeController().validateTwitId(twitId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    const data = await new LikeService().addLike(user.userId, twitId);
    await new MetricController().createLikeMetric(user.username);
    res.status(201).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const removeLike = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    let twitId = req.body.twitId;

    twitId = new LikeController().validateTwitId(twitId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    await new LikeService().removeLike(user.userId, twitId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getLikesByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    const data = await new LikeService().getLikesByUser(user.userId);

    res.status(200).json({ data: data });
  } catch (error) {
    next(error);
  }
};
