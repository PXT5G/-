import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';
import type { WeatherType } from '../../constants/gtaMap';

export interface IWorldState extends Document {
  userId: Types.ObjectId;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  altitude: number;
  district: string;
  street: string;
  zone: string;
  region: string;
  vehicleState: 'on_foot' | 'in_vehicle' | 'on_motorcycle' | 'in_boat' | 'in_aircraft';
  weather: WeatherType;
  timeOfDay: string;
  gameHour: number;
  interior: boolean;
  safeZone: boolean;
  restrictedZone: boolean;
  nearestLocationId?: string;
  connectedTowerUuid?: string;
  lastTickAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const worldStateSchema = new Schema<IWorldState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    latitude: { type: Number, default: 34.0522 },
    longitude: { type: Number, default: -118.2437 },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 15 },
    district: { type: String, default: 'Downtown Los Santos' },
    street: { type: String, default: 'San Andreas Avenue' },
    zone: { type: String, default: 'Central Los Santos' },
    region: { type: String, default: 'San Andreas' },
    vehicleState: {
      type: String,
      enum: ['on_foot', 'in_vehicle', 'on_motorcycle', 'in_boat', 'in_aircraft'],
      default: 'on_foot',
    },
    weather: { type: String, default: 'clear' },
    timeOfDay: { type: String, default: 'day' },
    gameHour: { type: Number, default: 12 },
    interior: { type: Boolean, default: false },
    safeZone: { type: Boolean, default: false },
    restrictedZone: { type: Boolean, default: false },
    nearestLocationId: { type: String },
    connectedTowerUuid: { type: String },
    lastTickAt: { type: Date, default: Date.now },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const WorldState = mongoose.model<IWorldState>('WorldState', worldStateSchema);
