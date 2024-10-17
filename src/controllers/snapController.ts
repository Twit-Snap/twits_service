import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { JWTService } from '../service/jwtService';
import { SnapService } from '../service/snapService';
import { ITwitController } from '../types/controllerTypes';
import {
  AuthenticationError,
  NotFoundError,
  ServiceUnavailable,
  ValidationError
} from '../types/customErrors';
import { JwtUserPayload } from '../types/jwt';
import { CreateSnapBody, GetAllParams, SnapResponse, TwitUser, User } from '../types/types';
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

  validateUsersIds(usersIds: number[] | undefined): number[] {
    if (!usersIds) {
      throw new ValidationError('usersId', 'Users IDs required!');
    }

    if (!Array.isArray(usersIds)) {
      throw new ValidationError('usersId', 'Users IDs must be an array of IDs!');
    }

    return usersIds;
  }

  async getFollowedIds(user: JwtUserPayload): Promise<number[]> {
    return await axios
      .get(`${process.env.USERS_SERVICE_URL}/users/${user.username}/followers`, {
        headers: { Authorization: `Bearer ${new JWTService().sign(user)}` }
      })
      .then(response => {
        return response.data.map((user: User) => user.id);
      })
      .catch(error => {
        console.error(error.data);
        switch (error.status) {
          case 400:
            throw new ValidationError(error.response.data.field, error.response.data.detail);
          case 401:
            throw new AuthenticationError();
          case 404:
            throw new NotFoundError('username', user.username);
          case 500:
            throw new ServiceUnavailable();
        }
      });
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
    var params: GetAllParams = {
      createdAt: req.query.createdAt?.toString(),
      limit: req.query.limit ? +req.query.limit.toString() : undefined,
      older: req.query.older === 'true' ? true : false,
      has: req.query.has ? req.query.has.toString() : '',
      username: req.query.username?.toString(),
      byFollowed: req.query.byFollowed === 'true' ? true : false,
      hashtag: req.query.hashtag?.toString()
    };

    const user = (req as any).user;

    if (params.byFollowed) {
      params.followedIds = await new TwitController().getFollowedIds(user);
    }

    new LikeController().validateUserId(user.userId);

    const snaps: SnapResponse[] = await new SnapService().getAllSnaps(user.userId, params);
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
