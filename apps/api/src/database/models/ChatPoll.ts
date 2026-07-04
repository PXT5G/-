import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatPoll extends Document {
  pollId: string;
  messageId: string;
  conversationId: string;
  creatorId: Types.ObjectId;
  question: string;
  options: { optionId: string; text: string; voteCount: number }[];
  votes: { userId: Types.ObjectId; optionId: string }[];
  multipleChoice: boolean;
  anonymous: boolean;
  closed: boolean;
  closesAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatPollSchema = new Schema<IChatPoll>(
  {
    pollId: { type: String, required: true, unique: true, index: true },
    messageId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    options: [{
      optionId: { type: String, required: true },
      text: { type: String, required: true },
      voteCount: { type: Number, default: 0 },
    }],
    votes: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      optionId: { type: String },
    }],
    multipleChoice: { type: Boolean, default: false },
    anonymous: { type: Boolean, default: false },
    closed: { type: Boolean, default: false },
    closesAt: { type: Date },
  },
  { timestamps: true }
);

export const ChatPoll = mongoose.model<IChatPoll>('ChatPoll', chatPollSchema);
