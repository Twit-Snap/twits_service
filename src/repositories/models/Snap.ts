import mongoose, { Document, Schema } from 'mongoose';
import { UUID } from '../../utils/uuid';

export interface ISnapModel extends Document {
  _id: string;
  createdAt: string;
  user: {
    userId: number;
    name: string;
    username: string;
  };
  privacy: string;
  entities: {
    hashtags: { text: string }[];
  };
  content: string;
}

const TwitSnapSchema: Schema = new Schema(
  {
    _id: { type: String, default: UUID.generate },
    content: { type: String, required: true },
    user: {
      userId: { type: Number, required: true },
      name: { type: String, required: true },
      username: { type: String, required: true }
    },
    privacy: { type: String, required: true },
    entities: {
      hashtags: [{ text: { type: String } }]
    }
  },
  { timestamps: true }
);

export default mongoose.model<ISnapModel>('TwitSnap', TwitSnapSchema);
