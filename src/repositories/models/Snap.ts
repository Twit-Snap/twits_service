import mongoose, { Document, Schema } from 'mongoose';
import { UUID } from '../../utils/uuid';

export interface ISnapModel extends Document {
  _id: string;
  parent: string;
  createdAt: string;
  user: {
    userId: number;
    name: string;
    username: string;
  };
  privacy: string;
  entities: {
    hashtags: { text: string }[];
    userMentions: { username: string }[];
  };
  content: string;
  type: string;
}

const TwitSnapSchema: Schema = new Schema(
  {
    _id: { type: String, default: UUID.generate },
    parent: { type: String, ref: 'TwitSnap', default: null },
    type: { type: String, default: 'original' },
    content: { type: String },
    user: {
      userId: { type: Number, required: true },
      name: { type: String, required: true },
      username: { type: String, required: true }
    },
    privacy: { type: String, default: 'Everyone' },
    entities: {
      hashtags: [{ text: { type: String } }],
      userMentions: [{ username: { type: String } }]
    }
  },
  { timestamps: true }
);

export default mongoose.model<ISnapModel>('TwitSnap', TwitSnapSchema);
