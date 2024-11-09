import mongoose, { Document, Schema } from 'mongoose';

export interface IBookmarkModel extends Document {
  userId: number;
  twitId: string;
  bookmarkedAt: string;
}

const bookmarkSchema = new Schema({
  userId: { type: Number, required: true },
  twitId: { type: String, ref: 'TwitSnap', required: true },
  bookmarkedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IBookmarkModel>('Bookmark', bookmarkSchema);