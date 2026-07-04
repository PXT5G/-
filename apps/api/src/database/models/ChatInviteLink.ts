import mongoose, { Schema, Document } from 'mongoose';

export interface IChatInviteLink extends Document {
  linkId: string;
  conversationId: string;
  code: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses: number;
  uses: number;
  revoked: boolean;
  createdAt?: Date;
}

const chatInviteLinkSchema = new Schema<IChatInviteLink>(
  {
    linkId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    createdBy: { type: String, required: true },
    expiresAt: { type: Date },
    maxUses: { type: Number, default: 100 },
    uses: { type: Number, default: 0 },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ChatInviteLink = mongoose.model<IChatInviteLink>('ChatInviteLink', chatInviteLinkSchema);
