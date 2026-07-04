import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { OrderType, OrderSide, OrderStatus } from '../../constants/exchange';

export interface IOrder extends Document {
  orderId: string;
  userId: Types.ObjectId;
  portfolioId: string;
  stockId: string;
  ticker: string;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  limitPrice?: number;
  stopPrice?: number;
  averageFillPrice: number;
  totalCost: number;
  fee: number;
  expiresAt?: Date;
  filledAt?: Date;
  cancelledAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    portfolioId: { type: String, required: true, index: true },
    stockId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, index: true },
    type: { type: String, enum: ['market', 'limit', 'stop', 'stop_limit'], required: true },
    side: { type: String, enum: ['buy', 'sell'], required: true, index: true },
    status: { type: String, enum: ['pending', 'partial', 'filled', 'cancelled', 'expired', 'rejected'], default: 'pending', index: true },
    quantity: { type: Number, required: true, min: 1 },
    filledQuantity: { type: Number, default: 0 },
    remainingQuantity: { type: Number },
    limitPrice: { type: Number },
    stopPrice: { type: Number },
    averageFillPrice: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    expiresAt: { type: Date },
    filledAt: { type: Date },
    cancelledAt: { type: Date },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
