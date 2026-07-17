import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatBlockedUser extends Document {
  blockId: string;
  userId: Types.ObjectId;
  blockedUserId: Types.ObjectId;
  reason?: string;
  createdAt?: Date;
}

const chatBlockedUserSchema = new Schema<IChatBlockedUser>(
  {
    blockId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blockedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatBlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

export const ChatBlockedUser = mongoose.model<IChatBlockedUser>('ChatBlockedUser', chatBlockedUserSchema);
