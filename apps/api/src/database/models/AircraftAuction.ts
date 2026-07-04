import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IAircraftAuction extends Document {
  auctionId: string;
  aircraftId: string;
  dealerId?: string;
  companyId?: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  buyNowPrice?: number;
  highestBidderId?: Types.ObjectId;
  bidCount: number;
  bids: { bidId: string; bidderId: Types.ObjectId; amount: number; placedAt: Date }[];
  status: 'scheduled' | 'active' | 'ended' | 'cancelled' | 'sold';
  startsAt: Date;
  endsAt: Date;
  winnerId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const aircraftAuctionSchema = new Schema<IAircraftAuction>(
  {
    auctionId: { type: String, required: true, unique: true, index: true },
    aircraftId: { type: String, required: true, index: true },
    dealerId: { type: String, index: true },
    companyId: { type: String, index: true },
    startingBid: { type: Number, required: true, min: 0 },
    currentBid: { type: Number, default: 0 },
    reservePrice: { type: Number },
    buyNowPrice: { type: Number },
    highestBidderId: { type: Schema.Types.ObjectId, ref: 'User' },
    bidCount: { type: Number, default: 0 },
    bids: { type: [{ bidId: String, bidderId: Schema.Types.ObjectId, amount: Number, placedAt: Date }], default: [] },
    status: { type: String, enum: ['scheduled', 'active', 'ended', 'cancelled', 'sold'], default: 'scheduled', index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const AircraftAuction = mongoose.model<IAircraftAuction>('AircraftAuction', aircraftAuctionSchema);
