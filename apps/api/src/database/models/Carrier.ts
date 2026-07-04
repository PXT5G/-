import mongoose, { Schema, Document } from 'mongoose';

export interface ICarrier extends Document {
  name: string;
  code: string;
  country: string;
  mcc: string;
  mnc: string;
  logo?: string;
  active: boolean;
  supports5G: boolean;
  supportsWifiCalling: boolean;
  supportsRoaming: boolean;
}

const carrierSchema = new Schema<ICarrier>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    country: { type: String, default: 'Banana Republic' },
    mcc: { type: String, default: '001' },
    mnc: { type: String, default: '01' },
    logo: { type: String },
    active: { type: Boolean, default: true },
    supports5G: { type: Boolean, default: true },
    supportsWifiCalling: { type: Boolean, default: true },
    supportsRoaming: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Carrier = mongoose.model<ICarrier>('Carrier', carrierSchema);
