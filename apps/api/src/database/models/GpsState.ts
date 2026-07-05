import mongoose, { Schema, Document, Types } from 'mongoose';
import { auditSchemaFields } from '../baseSchema';

export interface IGpsState extends Document {
  userId: Types.ObjectId;
  destinationLocationId?: string;
  destinationName?: string;
  destinationLat?: number;
  destinationLng?: number;
  distanceRemainingM: number;
  etaSeconds: number;
  navigating: boolean;
  savedPlaces: { locationId: string; name: string; lat: number; lng: number }[];
  recentPlaces: { locationId: string; name: string; lat: number; lng: number; visitedAt: Date }[];
  favoritePlaces: { locationId: string; name: string; lat: number; lng: number }[];
  sharingEnabled: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const gpsStateSchema = new Schema<IGpsState>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    destinationLocationId: { type: String },
    destinationName: { type: String },
    destinationLat: { type: Number },
    destinationLng: { type: Number },
    distanceRemainingM: { type: Number, default: 0 },
    etaSeconds: { type: Number, default: 0 },
    navigating: { type: Boolean, default: false },
    savedPlaces: [{ locationId: String, name: String, lat: Number, lng: Number }],
    recentPlaces: [{ locationId: String, name: String, lat: Number, lng: Number, visitedAt: Date }],
    favoritePlaces: [{ locationId: String, name: String, lat: Number, lng: Number }],
    sharingEnabled: { type: Boolean, default: false },
    ...auditSchemaFields,
  },
  { timestamps: true }
);

export const GpsState = mongoose.model<IGpsState>('GpsState', gpsStateSchema);
