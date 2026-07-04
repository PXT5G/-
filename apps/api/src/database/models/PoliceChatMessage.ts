import mongoose, { Schema, Document, Types } from 'mongoose';
import type { PoliceRank } from './PolicePermission';

export interface IPoliceChatMessage extends Document {
  channel: string;
  minRank: PoliceRank;
  senderOfficerId: Types.ObjectId;
  senderUserId: Types.ObjectId;
  senderName: string;
  message: string;
  encrypted: boolean;
  createdAt: Date;
}

const policeChatMessageSchema = new Schema<IPoliceChatMessage>(
  {
    channel: { type: String, required: true, index: true },
    minRank: { type: String, enum: ['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief'], default: 'officer' },
    senderOfficerId: { type: Schema.Types.ObjectId, ref: 'PoliceOfficer', required: true },
    senderUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true, maxlength: 2000 },
    encrypted: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

policeChatMessageSchema.index({ channel: 1, createdAt: -1 });

export const PoliceChatMessage = mongoose.model<IPoliceChatMessage>('PoliceChatMessage', policeChatMessageSchema);

export const POLICE_CHANNELS = ['general', 'dispatch', 'investigations', 'command'] as const;
