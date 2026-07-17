import mongoose, { Schema, Document } from 'mongoose';
import type { CharacterPlatform } from '../../constants/characterPhone';

export interface IInventoryAttestation extends Document {
  attestationId: string;
  platform: CharacterPlatform;
  inventorySessionId: string;
  externalUserId: string;
  externalCharacterId: string;
  hasPhoneItem: boolean;
  phoneInventoryItemId?: string;
  phoneId?: string;
  deviceId?: string;
  attestedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryAttestationSchema = new Schema<IInventoryAttestation>(
  {
    attestationId: { type: String, required: true, unique: true, index: true },
    platform: { type: String, required: true, index: true },
    inventorySessionId: { type: String, required: true, index: true },
    externalUserId: { type: String, required: true, index: true },
    externalCharacterId: { type: String, required: true, index: true },
    hasPhoneItem: { type: Boolean, required: true },
    phoneInventoryItemId: { type: String },
    phoneId: { type: String, index: true },
    deviceId: { type: String, index: true },
    attestedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

inventoryAttestationSchema.index({ inventorySessionId: 1, externalCharacterId: 1 });

export const InventoryAttestation = mongoose.model<IInventoryAttestation>(
  'InventoryAttestation',
  inventoryAttestationSchema
);
