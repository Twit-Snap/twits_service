import { NextFunction, Request, Response } from 'express';
import { LikeRepository } from '../repositories/likeRepository';
import { SnapRepository } from '../repositories/snapRepository';
import { LikeService } from '../service/likeService';

const likeService = new LikeService();
const likeRepository = new LikeRepository();

export const getLikesByTwit = async (
  req: Request<{ twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    likeService.validateTwitId(req.params.twitId);

    const { twitId } = req.params;

    //Twit exist?
    await new SnapRepository().findById(twitId);

    const data = await likeRepository.getLikesByTwit(twitId);

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
    likeService.validateTwitId(req.body.twitId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    likeService.validateUserId(user.userId);

    const { twitId } = req.body;

    //Twit exist?
    await new SnapRepository().findById(twitId);

    const data = await likeRepository.add(user.userId, twitId);

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
    likeService.validateTwitId(req.body.twitId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    likeService.validateUserId(user.userId);

    const { twitId } = req.body;

    //Twit exist?
    await new SnapRepository().findById(twitId);

    await likeRepository.remove(user.userId, twitId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getLikesByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    likeService.validateUserId(user.userId);

    const data = await likeRepository.getLikesByUser(user.userId);

    res.status(200).json({ data: data });
  } catch (error) {
    next(error);
  }
};
