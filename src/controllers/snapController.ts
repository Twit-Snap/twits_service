import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { BookmarkService } from '../service/bookmarkService';
import { JWTService } from '../service/jwtService';
import { SnapService } from '../service/snapService';
import { ITwitController } from '../types/controllerTypes';
import {
  AuthenticationError,
  BlockedError,
  NotFoundError,
  ServiceUnavailable,
  ValidationError
} from '../types/customErrors';
import { JwtUserPayload } from '../types/jwt';
import {
  GetAllParams,
  GetByIdParams,
  ModifiableSnapBody,
  RankRequest,
  SnapBody,
  SnapResponse,
  TwitSnap,
  TwitUser,
  User,
  UserMention
} from '../types/types';
import removeDuplicates from '../utils/removeDups/removeDups';
import { removePrivateSnaps } from '../utils/removePrivateSnaps/removePrivateSnaps';
import { sendPushNotification } from '../utils/sendNotification';

var currentTrendingTopics: string[] = [];

export class TwitController implements ITwitController {
  validateContent(content: string | undefined): string {
    if (!content) {
      throw new ValidationError('content', 'The TwitSnap content is required.');
    }

    content = content.trim();

    if (content.length > 280) {
      throw new ValidationError(
        content,
        'The content of the TwitSnap must not exceed 280 characters.'
      );
    }

    return content;
  }

  validateTwitType(type: string, content: string | undefined, parent: string | undefined): string {
    switch (type) {
      case 'retwit':
        if (!parent) {
          throw new ValidationError('parent', 'Can not retwit if no parent is provided');
        }
        return '';

      case 'comment':
        if (!parent) {
          throw new ValidationError('parent', 'Can not comment if no parent is provided');
        }
        return this.validateContent(content);

      case 'original':
        if (parent) {
          throw new ValidationError(
            'parent',
            'Can not create a new original tweet if parent is provided'
          );
        }
        return this.validateContent(content);

      default:
        throw new ValidationError(
          'type',
          `${type} is not a valid type it must be 'retwit', 'comment' or 'original'`
        );
    }
  }

  validateTwitUser(user: TwitUser | undefined): TwitUser {
    if (!user?.name) {
      throw new ValidationError('user.name', 'User name must be specified');
    }

    if (!user?.username) {
      throw new ValidationError('user.username', 'User username must be specified');
    }

    if (!user?.userId) {
      throw new ValidationError('user.userId', 'User ID must be specified');
    }

    return user;
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
    const users = new Set(
      snaps
        .map(twit => {
          const ret = [twit.user.username];
          if (twit.parent) {
            ret.push((twit.parent as unknown as SnapResponse).user.username);
          }

          return ret;
        })
        .reduce((acc, current) => [...acc, ...current], [])
    );

    const userDetails = await Promise.all(
      [...users].map(async username => {
        return await this.getUser(username, user);
      })
    );

    const userMap = new Map<string, TwitUser>();
    userDetails.forEach(user => {
      if (user) {
        userMap.set(user.username, user);
      }
    });

    const ret = snaps.map(twit => {
      let r = {
        ...twit,
        user: {
          ...(userMap.get(twit.user.username) || twit.user)
        }
      };

      if (twit.parent) {
        const parent = twit.parent as unknown as SnapResponse;
        r = {
          ...r,
          parent: {
            ...parent,
            user: {
              ...(userMap.get(parent.user.username) || parent.user)
            }
          } as unknown as TwitSnap
        };
      }

      return r;
    });
    console.log(ret);
    return ret;
  }

  async loadSnapsToFeedAlgorithm() {
    const snapsToFeed = await new SnapService().loadSnapsToFeedAlgorithm();

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

  async getUser(username: string, authUser: JwtUserPayload): Promise<TwitUser> {
    return await axios
      .get(`${process.env.USERS_SERVICE_URL}/users/${username}`, {
        headers: { Authorization: `Bearer ${new JWTService().sign(authUser)}` },
        params: { reduce: true }
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
            throw new NotFoundError('username', username);
          case 500:
            throw new ServiceUnavailable();
        }
      });
  }

  async validateMentions(
    mentions: UserMention[],
    authUser: JwtUserPayload
  ): Promise<{ mentions: UserMention[]; users: TwitUser[] }> {
    let users = await Promise.all(
      mentions.map(({ username }) =>
        this.getUser(username, authUser)
          .then(user => user)
          .catch(() => undefined)
      )
    );

    const filtered = users.filter(user => user != undefined);

    return { mentions: filtered.map(user => ({ username: user.username })), users: filtered };
  }
  /* istanbul ignore next */
  async notifyMentions(users: TwitUser[], twit: SnapResponse): Promise<void> {
    users.forEach(user => {
      if (!user.followed) {
        return;
      }

      if (!user.expoToken) {
        return;
      }

      sendPushNotification(user.expoToken, `${twit.user.username} mention you!`, 'Check it out!', {
        params: { id: twit.id },
        type: 'twit'
      });
    });
  }
  /* istanbul ignore next */
  async checkTrending(snap: SnapResponse, authUser: JwtUserPayload) {
    const lowerCaseContent = snap.content.toLowerCase();

    console.log(currentTrendingTopics);

    Object.keys(currentTrendingTopics).forEach(async trending => {
      if (lowerCaseContent.includes(trending)) {
        await axios
          .post(
            `${process.env.USERS_SERVICE_URL}/users/notifications`,
            {
              title: `@${snap.user.username} posted a trending twit!`,
              body: snap.content,
              data: {
                params: { id: snap.id },
                type: 'twit',
                senderId: snap.user.userId
              }
            },
            {
              headers: { Authorization: `Bearer ${new JWTService().sign(authUser)}` }
            }
          )
          .catch(error => {
            switch (error.status) {
              case 400:
                throw new ValidationError(error.response.data.field, error.response.data.detail);
              case 401:
                throw new AuthenticationError();
              case 403:
                throw new BlockedError();
              case 500:
                throw new ServiceUnavailable();
            }
          });
      }
    });
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
  req: Request<{}, {}, SnapBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    let content: string | undefined = req.body.content;
    const type: string = req.body.type || 'original';
    const parent = req.body.parent;
    const privacy: string = req.body.privacy || 'Everyone';

    const controller = new TwitController();

    content = controller.validateTwitType(type, content, parent);

    const user = controller.validateTwitUser(req.body.user);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authUser = (req as any).user;

    const userMentions = new SnapService().extractMentions(content);
    const filteredMentions = await controller.validateMentions(userMentions, authUser);

    const snapBody = {
      content: content,
      type: type,
      parent: parent,
      user: user,
      privacy: privacy
    };

    const savedSnap: SnapResponse = await new SnapService().createSnap(
      snapBody,
      filteredMentions.mentions
    );

    if (savedSnap.type === 'original') {
      controller.checkTrending(savedSnap, authUser);
    }

    controller.notifyMentions(filteredMentions.users, savedSnap);

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
      withEntities: req.query.withEntities === 'true',
      noJoinParent: req.query.noJoinParent === 'true',
      parent: req.query.parent?.toString(),
      type: req.query.type ? JSON.parse(req.query.type?.toString()) : undefined,
      bookmarks: req.query.bookmarks === 'true',
      excludeTwits: []
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    const twitController = new TwitController();
    let snaps: SnapResponse[] = [];

    if (params.bookmarks) {
      const bookmarkedSnaps = await new BookmarkService().getBookmarksByUser(user.userId);
      snaps.push(...bookmarkedSnaps);
    } else {
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
            async (snap: SnapResponse) => await new SnapService().getSnapById(snap.id, params)
          )
        );
        console.log(
          'Fetched from the algo the following Tweets for user: ',
          user.username,
          ' --> ',
          rank_result.data.ranking.data
        );
        snaps.push(...rank_result.data.ranking.data);
        params.excludeTwits = rank_result.data.ranking.data.map((twit: SnapResponse) => twit.id);
      }

      if (params.byFollowed) {
        params.followedIds = await twitController.getFollowedIds(user);
      }

      new TwitController().validateCreatedAt(params.createdAt);

      const result: SnapResponse[] = await new SnapService().getAllSnaps(params);

      snaps.push(...result);
      //Filter out duplicates returned by either of the two methods
      snaps = params.rank ? removeDuplicates(snaps) : snaps;
    }

    snaps = snaps.filter(({ type, isBlocked, parent }) =>
      type === 'retwit' ? !(parent as unknown as SnapResponse).isBlocked : !isBlocked
    );

    //Add following / followed states
    snaps = user.type === 'user' ? await twitController.addFollowState(user, snaps) : snaps;
    const resultInteractions = await new SnapService().addInteractions(user.userId, snaps);

    const final_snaps = removePrivateSnaps(user, resultInteractions);

    res.status(200).json({ data: final_snaps });
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
      // withEntities: req.query.withEntities === 'true',
      noJoinParent: req.query.noJoinParent === 'true'
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    let snap: SnapResponse = await new SnapService().getSnapById(id, params);

    if (snap.isBlocked) {
      throw new NotFoundError('twit', id);
    }

    snap =
      user.type === 'user' ? (await new TwitController().addFollowState(user, [snap]))[0] : snap;

    const resultInteractions = (await new SnapService().addInteractions(user.userId, [snap]))[0];

    res.status(200).json({ data: resultInteractions });
  } catch (error) {
    next(error);
  }
};

export const deleteSnapById = async (
  req: Request<{ id: string }, { retwit: boolean }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const retwit = req.query.retwit?.toString() === 'true';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (req as any).user;

    if (retwit) {
      await new SnapService().deleteRetwit(id, user.userId);
    } else {
      await new SnapService().deleteSnapById(id);
    }

    await new TwitController().loadSnapsToFeedAlgorithm();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const editSnapById = async (
  req: Request<{ id: string }, {}, SnapBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    let edited_content: string | undefined = req.body.content;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authUser = (req as any).user;

    const controller = new TwitController();

    let filteredMentions: {
      mentions: UserMention[];
      users: TwitUser[];
    } = { mentions: [], users: [] };

    if (edited_content) {
      edited_content = controller.validateContent(edited_content);
      let userMentions = new SnapService().extractMentions(edited_content);
      filteredMentions = await controller.validateMentions(userMentions, authUser);
    }

    const modifiable: ModifiableSnapBody = {
      content: edited_content,
      isBlocked: req.body.isBlocked
    };

    const savedSnap = await new SnapService().editSnapById(
      id,
      modifiable,
      filteredMentions.mentions
    );

    controller.notifyMentions(filteredMentions.users, savedSnap);

    await controller.loadSnapsToFeedAlgorithm();
    res.status(200).json({ data: savedSnap });
  } catch (error) {
    next(error);
  }
};

export const getTrendingTopics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trendingTopics = await axios
      .post(`${process.env.FEED_ALGORITHM_URL}/trending`, {
        limit: 5
      })
      .then(({ data }) => data)
      .catch(error => {
        console.error(error.data);
        switch (error.status) {
          case 500:
            throw new ServiceUnavailable();
        }
      });

    currentTrendingTopics = trendingTopics.trends.data.reduce((acc: object, t: object) => ({
      ...acc,
      ...t
    }));

    console.log('Fetched trending topics: ', trendingTopics.trends.data);
    res.status(200).json({ data: trendingTopics.trends.data });
  } catch (error) {
    next(error);
  }
};
