import { BookmarkRepository } from '../repositories/bookmarkRepository';
import { SnapRepository } from '../repositories/snapRepository';
import { IBookmarkService } from '../types/servicesTypes';
import { BookmarkResponse, SnapResponse } from '../types/types';

export class BookmarkService implements IBookmarkService {
  async getBookmarksByTwit(twitId: string): Promise<number> {
    //Twit exist?
    await new SnapRepository().findById(twitId);

    const data = await new BookmarkRepository().getBookmarksByTwit(twitId);

    return data;
  }

  async addBookmark(userId: number, twitId: string): Promise<BookmarkResponse> {
    //Twit exist?
    await new SnapRepository().findById(twitId);

    const data = await new BookmarkRepository().add(userId, twitId);

    return data;
  }

  async removeBookmark(userId: number, twitId: string): Promise<void> {
    //Twit exist?
    await new SnapRepository().findById(twitId);

    await new BookmarkRepository().remove(userId, twitId);
  }

  async getBookmarksByUser(userId: number): Promise<SnapResponse[]> {
    const data = await new BookmarkRepository().getBookmarksByUser(userId);
    return data;
  }

  async addBookmarkInteractions(userId: number, twits: SnapResponse[]): Promise<SnapResponse[]> {
    return await Promise.all(
      twits.map(async twit => {
        const realTwit = twit.type === 'retwit' ? (twit.parent as unknown as SnapResponse) : twit;

        return {
          ...twit,
          userBookmarked: await new BookmarkRepository().getUserBookmarkedTwit(userId, realTwit.id),
          bookmarkCount: await new BookmarkRepository().getBookmarksByTwit(realTwit.id)
        };
      })
    );
  }
}