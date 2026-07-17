import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatCallParticipant extends Document {
  participantId: string;
  callId: string;
  userId: Types.ObjectId;
  muted: boolean;
  onHold: boolean;
  speaker: boolean;
  videoEnabled: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

const chatCallParticipantSchema = new Schema<IChatCallParticipant>(
  {
    participantId: { type: String, required: true, unique: true, index: true },
    callId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    muted: { type: Boolean, default: false },
    onHold: { type: Boolean, default: false },
    speaker: { type: Boolean, default: false },
    videoEnabled: { type: Boolean, default: false },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { timestamps: false }
);

chatCallParticipantSchema.index({ callId: 1, userId: 1 }, { unique: true });

export const ChatCallParticipant = mongoose.model<IChatCallParticipant>('ChatCallParticipant', chatCallParticipantSchema);
