import mongoose, { Schema, Document } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export type TowerStatus = 'online' | 'degraded' | 'maintenance' | 'offline';

export interface ICellTower extends Document {
  towerUuid: string;
  towerName: string;
  latitude: number;
  longitude: number;
  coverageRadiusM: number;
  signalPower: number;
  frequencyBand: string;
  carrier: string;
  towerHealth: number;
  currentUsers: number;
  maxUsers: number;
  status: TowerStatus;
  maintenance: boolean;
  district: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const cellTowerSchema = new Schema<ICellTower>(
  {
    towerUuid: { type: String, required: true, unique: true, index: true },
    towerName: { type: String, required: true },
    latitude: { type: Number, required: true, index: true },
    longitude: { type: Number, required: true, index: true },
    coverageRadiusM: { type: Number, default: 2500 },
    signalPower: { type: Number, default: 100 },
    frequencyBand: { type: String, default: 'n78' },
    carrier: { type: String, default: 'Banana Mobile', index: true },
    towerHealth: { type: Number, default: 100 },
    currentUsers: { type: Number, default: 0 },
    maxUsers: { type: Number, default: 500 },
    status: { type: String, enum: ['online', 'degraded', 'maintenance', 'offline'], default: 'online' },
    maintenance: { type: Boolean, default: false },
    district: { type: String, default: '', index: true },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

cellTowerSchema.index({ latitude: 1, longitude: 1 });

export const CellTower = mongoose.model<ICellTower>('CellTower', cellTowerSchema);
