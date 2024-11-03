import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { JWTService } from '../service/jwtService';
import { LikeService } from '../service/likeService';
import { SnapService } from '../service/snapService';
import { ITwitController } from '../types/controllerTypes';
import {
  AuthenticationError,
  NotFoundError,
  ServiceUnavailable,
  ValidationError
} from '../types/customErrors';
import { JwtUserPayload } from '../types/jwt';
import {
  CreateSnapBody,
  GetAllParams, GetByIdParams,
  RankRequest,
  SnapResponse,
  TwitUser,
  User
} from '../types/types';
import removeDuplicates from '../utils/removeDups/removeDups';

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

  validateCreatedAt(createdAt: string | undefined) {
    if (createdAt) {
      const createdAtDate = new Date(createdAt);

      if (isNaN(createdAtDate.getTime())) {
        throw new ValidationError('createdAt', 'Invalid date format.');
      }
    }
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

  async addFollowState(user: JwtUserPayload, snaps: SnapResponse[]): Promise<SnapResponse[]> {
    const users = new Set(snaps.map(twit => twit.user.username));

    const userDetails = await Promise.all(
      [...users].map(async username => {
        return await axios
          .get(`${process.env.USERS_SERVICE_URL}/users/${username}`, {
            headers: { Authorization: `Bearer ${new JWTService().sign(user)}` }
          })
          .then(response => {
            return response.data.data;
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
      })
    );

    const userMap = new Map<string, TwitUser>();
    userDetails.forEach(user => {
      if (user) {
        userMap.set(user.username, user);
      }
    });

    const ret = snaps.map(twit => ({
      ...twit,
      user: {
        ...(userMap.get(twit.user.username) || twit.user),
        userId: twit.user.userId,
        id: undefined,
        followersCount: undefined,
        followingCount: undefined,
        birthdate: undefined,
        createdAt: undefined
      }
    }));

    return ret;
  }

  async loadSnapsToFeedAlgorithm(snapsToFeed: RankRequest) {
    await axios.post(`${process.env.FEED_ALGORITHM_URL}/`, snapsToFeed).catch(error => {
      console.error(error.data);
      switch (error.status) {
        case 401:
          throw new AuthenticationError();
        case 500:
          throw new ServiceUnavailable();
      }
    });
    console.log('Snaps loaded to feed algorithm');
  }
}

export const getTotalAmount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    var params: GetAllParams = {
      createdAt: req.query.createdAt?.toString(),
      limit: undefined,
      offset: undefined,
      older: false,
      has: req.query.has ? req.query.has.toString() : '',
      username: req.query.username?.toString(),
      byFollowed: false,
      hashtag: req.query.hashtag?.toString(),
      exactDate: req.query.exactDate === 'true'
    };

    new TwitController().validateCreatedAt(params.createdAt);

    const totalAmount = await new SnapService().getTotalAmount(params);
    res.status(200).json({ data: totalAmount });
  } catch (error) {
    next(error);
  }
};

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
      limit: req.query.limit ? +req.query.limit.toString() : 20,
      offset: req.query.offset ? +req.query.offset.toString() : 0,
      older: req.query.older === 'true',
      has: req.query.has ? req.query.has.toString() : '',
      username: req.query.username?.toString(),
      byFollowed: req.query.byFollowed === 'true',
      hashtag: req.query.hashtag?.toString(),
      rank: req.query.rank?.toString(),
      exactDate: req.query.exactDate === 'true',
      withEntities: req.query.withEntities === 'true'
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    let snaps: SnapResponse[] = [];

    if (params.rank && !params.byFollowed) {
      params.limit = params.limit ? Math.floor(params.limit / 4) : 5;
      const sample_snaps = await new SnapService().getSnapSample(user.userId);
      let sample_snaps_request: RankRequest = {
        data: sample_snaps.data,
        limit: params.limit ? params.limit * 3 : 15
      };
      const rank_result = await axios.post(
        `${process.env.FEED_ALGORITHM_URL}/rank`,
        sample_snaps_request
      );
      rank_result.data.ranking.data = await Promise.all(
        rank_result.data.ranking.data.map(
          async (snap: SnapResponse) => await new SnapService().getSnapById(snap.id,params)
        )
      );
      console.log(
        'Fetched from the algo the following Tweets for user: ',
        user.username,
        ' --> ',
        rank_result.data.ranking.data
      );
      snaps.push(...rank_result.data.ranking.data);
    }

    const twitController = new TwitController();

    if (params.byFollowed) {
      params.followedIds = await twitController.getFollowedIds(user);
    }

    new TwitController().validateCreatedAt(params.createdAt);

    const result: SnapResponse[] = await new SnapService().getAllSnaps(params);
    snaps.push(...result);

    //Filter out duplicates returned by either of the two methods
    snaps = params.rank ? removeDuplicates(snaps) : snaps;

    //Add following / followed states
    snaps = user.type === 'user' ? await twitController.addFollowState(user, snaps) : snaps;
    const resultInteractions = await new LikeService().addLikeInteractions(user.userId, snaps);

    res.status(200).json({ data: resultInteractions });
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

    const params: GetByIdParams = {
      withEntities: req.query.withEntities === 'true'
    };


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    let snap: SnapResponse = await new SnapService().getSnapById(id, params);
    snap =
      user.type === 'user' ? (await new TwitController().addFollowState(user, [snap]))[0] : snap;

    const resultInteractions = (
      await new LikeService().addLikeInteractions(user.userId, [snap])
    )[0];

    res.status(200).json({ data: resultInteractions });
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

    const snapsToFeed = await new SnapService().loadSnapsToFeedAlgorithm();
    await new TwitController().loadSnapsToFeedAlgorithm(snapsToFeed);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const editSnapById = async (
  req: Request<{ id: string }, {}, CreateSnapBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    let edited_content: string | undefined = req.body.content;

    edited_content = new TwitController().validateContent(edited_content);
    await new SnapService().editSnapById(id, edited_content);

    //const snapsToFeed = await new SnapService().loadSnapsToFeedAlgorithm();
    //await new TwitController().loadSnapsToFeedAlgorithm(snapsToFeed);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
