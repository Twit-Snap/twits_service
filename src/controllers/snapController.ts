import { NextFunction, Request, Response } from 'express';
import { ISnapRepository, SnapRepository } from '../repositories/snapRepository';
import { ISnapService, SnapService } from '../service/snapService';
import {SnapResponse, CreateSnapBody, TwitUser, Entities, Hashtag} from '../types/types';
import { ValidationError } from '../types/customErrors';

const snapRepository: ISnapRepository = new SnapRepository();
const snapService: ISnapService = new SnapService();

function extractHashTags(content: string): Hashtag[] {
    const hashTags = content.match(/#\w+/g);
    return hashTags ? hashTags.map(tag => ({ text: tag })) : [];
}

export const createSnap = async (
  req: Request<{}, {}, CreateSnapBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    if (!content) {
      throw new ValidationError(content, 'The TwitSnap content is required.');
    }
    if (content.length > 280) {
      throw new ValidationError(
        content,
        'The content of the TwitSnap must not exceed 280 characters.'
      );
    }
    let user: TwitUser = {
      userId: req.body.authorId,
      name: req.body.authorName,
      username: req.body.authorUsername
    }
    let entities: Entities = {
      hashtags: extractHashTags(req.body.content)
    }
    const savedSnap: SnapResponse = await snapRepository.create(content, user, entities);
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

    const snaps: SnapResponse[] = await snapRepository.findAll(createdAt, limit, older);

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
    const snap: SnapResponse = await snapRepository.findById(id);
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
    await snapRepository.deleteById(id);
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
        const snaps: SnapResponse[] = await snapRepository.findByHashtag(hashtag);
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

    snapService.validateUsersIds(usersIds);

    const snaps: SnapResponse[] = await snapRepository.findByUsersIds(
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
    const { username } = req.params;
    if (!username) {
      throw new ValidationError('username', 'Username required!');
    }
    const snaps: SnapResponse[] = await snapRepository.findByUsername(username);
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};
