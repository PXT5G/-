import mongoose, { Schema, Document } from 'mongoose';

export interface IChatSticker extends Document {
  stickerId: string;
  packId: string;
  emoji: string;
  label: string;
  sortOrder: number;
}

const chatStickerSchema = new Schema<IChatSticker>(
  {
    stickerId: { type: String, required: true, unique: true, index: true },
    packId: { type: String, required: true, index: true },
    emoji: { type: String, required: true },
    label: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: false }
);

export const ChatSticker = mongoose.model<IChatSticker>('ChatSticker', chatStickerSchema);
