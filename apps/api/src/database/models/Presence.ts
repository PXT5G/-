import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { PresenceState } from '../../constants/communication';

export interface IPresence extends Document {
  userId: Types.ObjectId;
  state: PresenceState;
  customStatus?: string;
  lastSeenAt: Date;
  lastActiveAt: Date;
  invisible: boolean;
  doNotDisturb: boolean;
  activeConversationId?: string;
  deviceId?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const presenceSchema = new Schema<IPresence>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    state: {
      type: String,
      enum: ['online', 'offline', 'idle', 'typing', 'recording_voice', 'uploading', 'downloading', 'reading', 'invisible', 'dnd'],
      default: 'offline',
      index: true,
    },
    customStatus: { type: String },
    lastSeenAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    invisible: { type: Boolean, default: false },
    doNotDisturb: { type: Boolean, default: false },
    activeConversationId: { type: String },
    deviceId: { type: String },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Presence = mongoose.model<IPresence>('Presence', presenceSchema);
