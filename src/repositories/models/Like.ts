import mongoose, { Document, Schema } from 'mongoose';

export interface ILikeModel extends Document {
  userId: number;
  twitId: string;
  createdAt: string;
}

const likeSchema = new Schema({
  userId: { type: Number, required: true },
  twitId: { type: String, ref: 'TwitSnap', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ILikeModel>('Like', likeSchema);
