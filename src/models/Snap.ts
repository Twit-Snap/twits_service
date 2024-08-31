import mongoose, { Schema, Document } from 'mongoose';

export interface ISnap extends Document {
  message: string;
}

const SnapSchema: Schema = new Schema({
  message: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<ISnap>('Snap', SnapSchema);