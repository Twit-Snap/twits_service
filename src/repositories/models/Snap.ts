import mongoose, { Document, Schema } from 'mongoose';

export interface ISnapModel extends Document {
  message: string;
}

const SnapSchema: Schema = new Schema({
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISnapModel>('Snap', SnapSchema);