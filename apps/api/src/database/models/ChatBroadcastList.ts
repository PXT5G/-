import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IChatBroadcastList extends Document {
  listId: string;
  ownerId: Types.ObjectId;
  title: string;
  memberIds: Types.ObjectId[];
  conversationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

const chatBroadcastListSchema = new Schema<IChatBroadcastList>(
  {
    listId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    conversationId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const ChatBroadcastList = mongoose.model<IChatBroadcastList>('ChatBroadcastList', chatBroadcastListSchema);
