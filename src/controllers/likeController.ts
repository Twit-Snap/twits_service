import { NextFunction, Request, Response } from 'express';
import { LikeRepository } from '../repositories/likeRepository';
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

    const data = await likeRepository.getLikesByTwit(twitId);

    res.status(200).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const addLike = async (
  req: Request<{ userId: number; twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    likeService.validateTwitId(req.body.twitId);
    likeService.validateUserId(req.body.userId);

    const { userId, twitId } = req.body;

    const data = await likeRepository.add(+userId, twitId);

    res.status(201).json({ data: data });
  } catch (error) {
    next(error);
  }
};

export const removeLike = async (
  req: Request<{ userId: number; twitId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    likeService.validateTwitId(req.body.twitId);
    likeService.validateUserId(req.body.userId);

    const { userId, twitId } = req.body;

    await likeRepository.remove(+userId, twitId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getLikesByUser = async (
  req: Request<{ userId: number }>,
  res: Response,
  next: NextFunction
) => {
  try {
    likeService.validateUserId(req.params.userId.toString());

    const { userId } = req.params;

    const data = await likeRepository.getLikesByUser(userId);

    res.status(200).json({ data: data });
  } catch (error) {
    next(error);
  }
};
