import { NotFoundError } from '../types/customErrors';
import { BookmarkResponse, SnapResponse } from '../types/types';
import Bookmark from './models/Bookmark';
import { ISnapModel } from './models/Snap';

export interface IBookmarkRepository {
  add(userId: number, twitId: string): Promise<BookmarkResponse>;
  remove(userId: number, twitId: string): Promise<void>;
  getBookmarksByTwit(twitId: string): Promise<number>;
  getBookmarksByUser(userId: number): Promise<SnapResponse[]>;
  getUserBookmarkedTwit(userId: number, twitId: string): Promise<boolean>;
}

export class BookmarkRepository implements IBookmarkRepository {
  async add(userId: number, twitId: string): Promise<BookmarkResponse> {
    const bookmark = new Bookmark({
      userId: userId,
      twitId: twitId,
      bookmarkedAt: new Date().toISOString()
    });

    const savedBookmark = await bookmark.save();

    return {
      userId: savedBookmark.userId as number,
      twitId: savedBookmark.twitId,
      bookmarkedAt: savedBookmark.bookmarkedAt
    };
  }

  async remove(userId: number, twitId: string): Promise<void> {
    const result = await Bookmark.deleteOne({ userId: userId, twitId: twitId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Bookmark', `(user, twit) ; (${userId}, ${twitId})`);
    }
  }

  async getBookmarksByTwit(twitId: string): Promise<number> {
    const result = await Bookmark.countDocuments({ twitId: twitId });

    return result;
  }

  async getUserBookmarkedTwit(userId: number, twitId: string): Promise<boolean> {
    const result = await Bookmark.findOne({ twitId: twitId, userId: userId });

    return result ? true : false;
  }

  async getBookmarksByUser(userId: number): Promise<SnapResponse[]> {
    const bookmarks = await Bookmark.find({ userId: userId })
      .sort({ bookmarkedAt: -1 })
      .populate('twitId');

    const expandedBookmarks: SnapResponse[] = bookmarks.map(bookmark => {
      const twit: ISnapModel = bookmark.twitId as unknown as ISnapModel;

      return {
        id: twit._id,
        user: twit.user,
        content: twit.content,
        createdAt: twit.createdAt,
        privacy: twit.privacy,
        entities: twit.entities
      };
    });

    return expandedBookmarks;
  }
}
