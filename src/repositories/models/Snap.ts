import mongoose, { Document, Schema } from 'mongoose';
import { UUID } from '../../utils/uuid';

export interface ISnapModel extends Document {
  _id: string;
  message: string;
}

const SnapSchema: Schema = new Schema({
  _id: { type: String, default: UUID.generate },
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISnapModel>('Snap', SnapSchema);