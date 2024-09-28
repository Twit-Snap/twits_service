import mongoose, { Document, Schema } from 'mongoose';
import { UUID } from '../../utils/uuid';

export interface ISnapModel extends Document {
  id: string;
  createdAt: string;
  user: {
    userId: number;
    name: string;
    username: string;
  };
  content: string;
}

const TwitSnapSchema: Schema = new Schema(
  {
    id: { type: String, default: UUID.generate },
    content: { type: String, required: true },
    user: {
      userId: { type: Number, required: true },
      name: { type: String, required: true },
      username: { type: String, required: true }
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISnapModel>('TwitSnap', TwitSnapSchema);
